/**
 * Generates a completion summary for feedback rows shipped within the last N hours.
 * Writes a JSON artifact to tmp/feedback-steward/notifications/.
 *
 *   npm run steward:notify
 *   npm run steward:notify -- --since-hours 48
 *
 * Requires DATABASE_URL in .env.local.
 * Email delivery is out of scope for V2 — extend this script in Wave 6.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import * as path from 'path'
import { listFeedbackForAdmin } from '@/features/feedback/server/repository'
import type { FeedbackRow } from '@/features/feedback/types'

export interface NotifyOptions {
  sinceHours: number
  now?: Date
}

export interface NotifySummary {
  generatedAt: string
  sinceHours: number
  shippedCount: number
  rows: FeedbackRow[]
  byVersion: Record<string, string[]>
}

export async function runFeedbackNotify(options: NotifyOptions): Promise<NotifySummary> {
  const now = options.now ?? new Date()
  const cutoff = new Date(now.getTime() - options.sinceHours * 60 * 60 * 1000)

  const allShipped = await listFeedbackForAdmin({ status: 'shipped' })

  const recent = allShipped.filter((row) => {
    if (!row.resolvedAt) return false
    return new Date(row.resolvedAt) >= cutoff
  })

  const byVersion: Record<string, string[]> = {}
  for (const row of recent) {
    const version = row.versionResolved ?? 'unknown'
    if (!byVersion[version]) byVersion[version] = []
    if (row.userEmail && !byVersion[version].includes(row.userEmail)) {
      byVersion[version].push(row.userEmail)
    }
  }

  const summary: NotifySummary = {
    generatedAt: now.toISOString(),
    sinceHours: options.sinceHours,
    shippedCount: recent.length,
    rows: recent,
    byVersion,
  }

  const outputDir = path.join(process.cwd(), 'tmp', 'feedback-steward', 'notifications')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStamp = now.toISOString().slice(11, 16).replace(':', '')
  const outputPath = path.join(outputDir, `${dateStamp}-${timeStamp}-notify-summary.json`)
  writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

  return summary
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const sinceIndex = args.indexOf('--since-hours')
  const sinceHours = sinceIndex !== -1 ? parseInt(args[sinceIndex + 1], 10) : 24

  if (isNaN(sinceHours) || sinceHours <= 0) {
    process.stderr.write('--since-hours must be a positive integer\n')
    process.exit(1)
  }

  const summary = await runFeedbackNotify({ sinceHours })
  process.stderr.write(
    `Notification summary: ${summary.shippedCount} rows shipped in the last ${sinceHours}h\n`
  )
  if (summary.shippedCount > 0) {
    for (const [version, emails] of Object.entries(summary.byVersion)) {
      process.stderr.write(`  v${version}: ${emails.join(', ')}\n`)
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`)
    process.exit(1)
  })
}
