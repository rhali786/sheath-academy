import { isPostgresMode } from '@/features/lib/server/db'
import type { TrackUsageEventInput, UsageEvent } from '@/features/admin-metrics/types'
import { insertUsageEvent } from './repository'
import { insertMemoryUsageEvent } from './store'

/** Records a Fork Test usage event. Swallows errors so instrumentation never breaks routes. */
export async function trackUsageEvent(input: TrackUsageEventInput): Promise<UsageEvent | null> {
  try {
    if (isPostgresMode()) {
      return await insertUsageEvent(input)
    }
    const now = (input.occurredAt ?? new Date()).toISOString()
    return insertMemoryUsageEvent({
      id: `usage_mem_${Date.now()}`,
      ...input,
      occurredAt: now,
    })
  } catch {
    return null
  }
}
