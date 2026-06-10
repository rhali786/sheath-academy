/**
 * Checks the exact DB query path and Claude CLI dependency used by the feedback steward.
 *
 *   npm run steward:preflight
 *
 * Safe to run repeatedly: reads submitted feedback and performs a tiny Claude prompt.
 */

import { getUnclassifiedFeedback } from './feedback-requeue'
import { runClaudePreflight, type ClaudePreflightResult } from './claude-preflight'

export interface StewardPreflightResult {
  startedAt: string
  submittedCount: number
  sampleIds: string[]
  claude: ClaudePreflightResult
}

export async function runStewardPreflight(): Promise<StewardPreflightResult> {
  const startedAt = new Date().toISOString()
  const items = await getUnclassifiedFeedback()
  const claude = runClaudePreflight()

  return {
    startedAt,
    submittedCount: items.length,
    sampleIds: items.slice(0, 5).map((item) => item.id),
    claude,
  }
}

async function main(): Promise<void> {
  const result = await runStewardPreflight()

  const pending = result.sampleIds.length > 0
    ? `📋 Pending: ${result.sampleIds.join(', ')}${result.submittedCount > result.sampleIds.length ? ` (+${result.submittedCount - result.sampleIds.length} more)` : ''}`
    : '📋 No submitted feedback waiting'

  process.stderr.write(
    [
      '',
      '🚀 Sheath Academy Feedback Steward — Preflight',
      '',
      `✅ DB connected — ${result.submittedCount} submitted row${result.submittedCount === 1 ? '' : 's'} ready for classification`,
      `✅ Claude CLI ready (${result.claude.elapsedMs}ms, timeout ${Math.round(result.claude.timeoutMs / 1000)}s)`,
      pending,
      '',
      result.submittedCount > 0
        ? "All systems go. Run `npm run steward:daily -- --plan-only` to generate a plan."
        : 'Nothing to process right now.',
      '',
    ].join('\n'),
  )
  process.exit(0)
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
