import type { UsageEvent } from '@/features/admin-metrics/types'

let events: UsageEvent[] = []

export function getMemoryUsageEvents(): UsageEvent[] {
  return [...events]
}

export function insertMemoryUsageEvent(event: UsageEvent): UsageEvent {
  events.push(event)
  return event
}

export function resetMemoryUsageEvents(): void {
  events = []
}

export function seedMemoryUsageEvents(seed: UsageEvent[]): void {
  events = [...seed]
}
