/**
 * Lists unclassified feedback (status='submitted') and outputs JSON to stdout.
 *
 *   npm run steward:requeue
 *
 * Designed to be piped into feedback-classify or run-classify.
 * Output: { items: FeedbackRequeueItem[] }
 */

import { listUnclassifiedFeedback } from '@/features/feedback/server/repository'
import type { FeedbackSentiment } from '@/features/feedback/types'

export interface FeedbackRequeueItem {
  id: string
  message: string | null
  pagePath: string
  sentiment: FeedbackSentiment
  createdAt: string
  userId: string | null
  userEmail: string
}

export async function getUnclassifiedFeedback(): Promise<FeedbackRequeueItem[]> {
  const rows = await listUnclassifiedFeedback()

  return rows.map((r) => ({
    id: r.id,
    message: r.message ?? null,
    pagePath: r.pagePath,
    sentiment: r.sentiment,
    createdAt: r.createdAt,
    userId: r.userId ?? null,
    userEmail: r.userEmail,
  }))
}

if (require.main === module) {
  getUnclassifiedFeedback()
    .then((items) => {
      process.stdout.write(JSON.stringify({ items }, null, 2))
      process.exit(0)
    })
    .catch((err) => {
      process.stderr.write(`Error: ${err.message}\n`)
      process.exit(1)
    })
}
