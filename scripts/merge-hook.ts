/**
 * Marks feedback rows shipped after a PR is confirmed merged into dev.
 *
 *   npm run steward:merge-hook -- --pr 42 --version 2.1.0
 *
 * Requires DATABASE_URL in .env.local and `gh` CLI authenticated.
 * Exits non-zero if the PR is not merged into dev or no shippable rows exist.
 */

import { spawnSync } from 'child_process'
import { markFeedbackShippedByPr, type FeedbackShipInput } from '@/features/feedback/server/service'

export interface MergeHookOptions {
  prNumber: number
  versionResolved: string
  changelogVersion?: string | null
}

interface GhPrData {
  number: number
  state: string
  baseRefName: string
  mergedAt: string | null
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

export async function runMergeHook(options: MergeHookOptions): Promise<void> {
  const pr = fetchPrData(options.prNumber)

  if (pr.state !== 'MERGED') {
    throw new Error(`PR #${options.prNumber} is not merged (state: ${pr.state})`)
  }

  if (pr.baseRefName !== 'dev') {
    throw new Error(`PR #${options.prNumber} is not merged into dev (base: ${pr.baseRefName})`)
  }

  const shipInput: FeedbackShipInput = {
    versionResolved: options.versionResolved,
    changelogVersion: options.changelogVersion ?? null,
  }

  await markFeedbackShippedByPr(options.prNumber, shipInput)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  const prIndex = args.indexOf('--pr')
  const versionIndex = args.indexOf('--version')
  const changelogIndex = args.indexOf('--changelog-version')

  if (prIndex === -1 || !args[prIndex + 1]) {
    process.stderr.write('Usage: steward:merge-hook -- --pr <number> --version <semver> [--changelog-version <semver>]\n')
    process.exit(1)
  }

  const prNumber = parseInt(args[prIndex + 1], 10)
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    process.stderr.write(`Invalid PR number: ${args[prIndex + 1]}\n`)
    process.exit(1)
  }

  if (versionIndex === -1 || !args[versionIndex + 1]) {
    process.stderr.write('--version is required\n')
    process.exit(1)
  }

  const versionResolved = args[versionIndex + 1]
  const changelogVersion = changelogIndex !== -1 ? args[changelogIndex + 1] ?? null : null

  await runMergeHook({ prNumber, versionResolved, changelogVersion })
  process.stderr.write(`PR #${prNumber} shipped — rows marked as shipped at version ${versionResolved}\n`)
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
