/**
 * Resets classification state for feedback rows that were mutated by a failed
 * or unwanted steward:daily run, returning them to 'submitted' status.
 *
 * Safe to run after a timeout or bad classify run — skips rows already attached
 * to a PR (those need steward:rollback instead).
 *
 *   npm run steward:reset-classification           # dry-run: shows what would change
 *   npm run steward:reset-classification -- --confirm              # execute the reset
 *   npm run steward:reset-classification -- --confirm --include-cancelled  # also reset duplicates
 */

import { listFeedback } from '@/features/feedback/server/repository'
import { resetClassification } from '@/features/feedback/server/service'
import type { FeedbackRow } from '@/features/feedback/types'

export interface ResetClassificationOptions {
  dryRun: boolean
  includeCancelled: boolean
}

export interface ResetClassificationResult {
  resetIds: string[]
  dryRun: boolean
}

const RESETTABLE_STATUSES = new Set<FeedbackRow['status']>(['reviewed', 'awaiting_approval'])

export async function runResetClassification(
  options: ResetClassificationOptions,
): Promise<ResetClassificationResult> {
  const allRows = await listFeedback()

  const toReset = allRows.filter((row) => {
    if (row.prNumber !== null) return false
    if (RESETTABLE_STATUSES.has(row.status)) return true
    if (options.includeCancelled && row.status === 'cancelled') return true
    return false
  })

  const resetIds = toReset.map((row) => row.id)

  if (!options.dryRun && resetIds.length > 0) {
    await resetClassification(resetIds)
  }

  return { resetIds, dryRun: options.dryRun }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--confirm')
  const includeCancelled = args.includes('--include-cancelled')

  process.stderr.write('\n🔄 Sheath Academy Feedback Steward — Reset Classification\n\n')

  const result = await runResetClassification({ dryRun, includeCancelled })

  if (result.resetIds.length === 0) {
    process.stderr.write('✅ Nothing to reset — no classified/awaiting_approval rows without a PR.\n\n')
    return
  }

  if (result.dryRun) {
    process.stderr.write(`📋 Dry run — ${result.resetIds.length} row${result.resetIds.length === 1 ? '' : 's'} would be reset to submitted:\n`)
    for (const id of result.resetIds) {
      process.stderr.write(`   • ${id}\n`)
    }
    process.stderr.write('\nRun with --confirm to apply. Add --include-cancelled to also reset duplicate rows.\n\n')
  } else {
    process.stderr.write(`✅ Reset ${result.resetIds.length} row${result.resetIds.length === 1 ? '' : 's'} back to submitted:\n`)
    for (const id of result.resetIds) {
      process.stderr.write(`   • ${id}\n`)
    }
    process.stderr.write('\nRows are now eligible for re-classification. Run npm run steward:daily -- --plan-only\n\n')
  }
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
