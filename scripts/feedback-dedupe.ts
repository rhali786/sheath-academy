/**
 * Detects duplicate feedback by comparing messages (Jaccard similarity) or matching prNumber.
 *
 * Usage (standalone):
 *   npm run steward:dedupe -- --id <feedbackId>
 *
 * Exported functions are used by run-classify.ts.
 * Output: { isDuplicate: boolean, duplicateOfId: string | null, reason: string | null }
 */

import { getFeedbackById, listFeedback } from '@/features/feedback/server/repository'
import type { FeedbackRow } from '@/features/feedback/types'

export interface DedupeResult {
  isDuplicate: boolean
  duplicateOfId: string | null
  reason: string | null
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  const intersection = new Set([...a].filter((x) => b.has(x)))
  const union = new Set([...a, ...b])
  return intersection.size / union.size
}

const SIMILARITY_THRESHOLD = 0.6
const MESSAGE_DUPLICATE_EXCLUDED_STATUSES = new Set<FeedbackRow['status']>(['submitted', 'cancelled'])
const PR_DUPLICATE_EXCLUDED_STATUSES = new Set<FeedbackRow['status']>(['cancelled'])

export async function detectDuplicate(candidateId: string): Promise<DedupeResult> {
  const candidate = await getFeedbackById(candidateId)
  if (!candidate) {
    return { isDuplicate: false, duplicateOfId: null, reason: null }
  }

  const existingRows = await listFeedback()

  // PR number match: if same prNumber exists on another non-cancelled item, it's a duplicate
  if (candidate.prNumber !== null) {
    const prMatch = existingRows.find(
      (row) =>
        row.id !== candidateId &&
        row.prNumber === candidate.prNumber &&
        !PR_DUPLICATE_EXCLUDED_STATUSES.has(row.status)
    )

    if (prMatch) {
      return { isDuplicate: true, duplicateOfId: prMatch.id, reason: 'matching_pr_number' }
    }
  }

  // Message similarity: compare against all non-submitted, non-cancelled items
  if (candidate.message && candidate.message.trim().length > 0) {
    const candidateTokens = tokenize(candidate.message)

    for (const row of existingRows) {
      if (row.id === candidateId) continue
      if (MESSAGE_DUPLICATE_EXCLUDED_STATUSES.has(row.status)) continue
      if (!row.message || row.message.trim().length === 0) continue
      const rowTokens = tokenize(row.message)
      const similarity = jaccardSimilarity(candidateTokens, rowTokens)
      if (similarity >= SIMILARITY_THRESHOLD) {
        return { isDuplicate: true, duplicateOfId: row.id, reason: 'message_similarity' }
      }
    }
  }

  return { isDuplicate: false, duplicateOfId: null, reason: null }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const idFlag = args.indexOf('--id')
  const id = idFlag !== -1 ? args[idFlag + 1] : null

  if (!id) {
    process.stderr.write('Usage: tsx scripts/feedback-dedupe.ts --id <feedbackId>\n')
    process.exit(1)
  }

  detectDuplicate(id)
    .then((result) => {
      process.stdout.write(JSON.stringify(result, null, 2))
      process.exit(0)
    })
    .catch((err) => {
      process.stderr.write(`Error: ${err.message}\n`)
      process.exit(1)
    })
}
