/**
 * Rolls back steward metadata for an unmerged PR and closes the PR if still open.
 *
 *   npm run steward:rollback -- --pr 42
 *
 * Requires DATABASE_URL in .env.local and `gh` CLI authenticated.
 */

import { spawnSync } from 'child_process'
import { deleteChangelogEntryByPrNumber } from '@/features/about/server/repository'
import { rollbackFeedbackAttachedToPr } from '@/features/feedback/server/service'

export interface RunRollbackOptions {
  prNumber: number
}

interface GhPrData {
  number: number
  state: string
  baseRefName: string
  mergedAt: string | null
  headRefName: string
}

function getGhCommand(): string {
  return process.platform === 'win32' ? 'gh.exe' : 'gh'
}

function fetchPrData(prNumber: number): GhPrData {
  const result = spawnSync(
    getGhCommand(),
    ['pr', 'view', String(prNumber), '--json', 'number,state,baseRefName,mergedAt,headRefName'],
    { encoding: 'utf8', timeout: 30_000 },
  )

  if (result.error) throw result.error

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(result.stderr.trim() || `gh exited with status ${result.status}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    throw new Error('gh pr view returned invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).number !== 'number'
  ) {
    throw new Error('gh pr view returned unexpected shape')
  }

  return parsed as GhPrData
}

function closePr(prNumber: number): void {
  const result = spawnSync(
    getGhCommand(),
    ['pr', 'close', String(prNumber), '--comment', 'Rolled back by steward:rollback'],
    { encoding: 'utf8', timeout: 30_000 },
  )

  if (result.error) throw result.error

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(result.stderr.trim() || `gh exited with status ${result.status}`)
  }
}

export async function runRollback(options: RunRollbackOptions): Promise<void> {
  const pr = fetchPrData(options.prNumber)

  if (pr.state === 'MERGED' || pr.mergedAt) {
    throw new Error(`PR #${options.prNumber} is already merged; steward:rollback only supports unmerged PRs`)
  }

  if (pr.state === 'OPEN') {
    closePr(options.prNumber)
  }

  await rollbackFeedbackAttachedToPr(options.prNumber)
  await deleteChangelogEntryByPrNumber(options.prNumber)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const prIndex = args.indexOf('--pr')

  if (prIndex === -1 || !args[prIndex + 1]) {
    process.stderr.write('Usage: steward:rollback -- --pr <number>\n')
    process.exit(1)
  }

  const prNumber = parseInt(args[prIndex + 1], 10)
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    process.stderr.write(`Invalid PR number: ${args[prIndex + 1]}\n`)
    process.exit(1)
  }

  await runRollback({ prNumber })
  process.stderr.write(`PR #${prNumber} rolled back — PR closed if open, feedback reset to classified, pending changelog removed\n`)
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
