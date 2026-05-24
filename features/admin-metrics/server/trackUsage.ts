// Stub — usage_events table being removed in Wave 3.
// Instrumentation calls are preserved in routes but events are no-ops until Wave 3 rewrites admin metrics.
import type { TrackUsageEventInput, UsageEvent } from '@/features/admin-metrics/types'

export async function trackUsageEvent(_input: TrackUsageEventInput): Promise<UsageEvent | null> {
  return null
}
