import {
  buildUserRow,
  computeDropOffSignals,
  computeSummaryFromEvents,
  filterAndSortUserRows,
  type HouseholdSnapshot,
} from '@/features/admin-metrics/server/metrics'
import type { UsageEvent } from '@/features/admin-metrics/types'

const snapshot: HouseholdSnapshot = {
  householdId: 'hh_1',
  householdName: 'Test Family',
  userId: 'user_1',
  userEmail: 'parent@test.com',
  learnerCount: 2,
  learnerNames: ['Ada', 'Bob'],
  lessonTasksInPeriod: 3,
  lessonsCompletedInPeriod: 1,
}

function ev(
  partial: Partial<UsageEvent> & Pick<UsageEvent, 'eventType' | 'occurredAt'>,
): UsageEvent {
  return {
    id: 'e1',
    userId: 'user_1',
    householdId: 'hh_1',
    featureArea: 'planner',
    ...partial,
  }
}

describe('computeSummaryFromEvents', () => {
  test('counts active users and fork test metrics', () => {
    const events: UsageEvent[] = [
      ev({ eventType: 'user_active', occurredAt: '2026-05-01T10:00:00Z', featureArea: 'planner' }),
      ev({ eventType: 'learner_created', occurredAt: '2026-05-02T10:00:00Z', featureArea: 'learners' }),
      ev({ eventType: 'lesson_completed', occurredAt: '2026-05-03T10:00:00Z', featureArea: 'planner' }),
      ev({ eventType: 'quran_record_created', occurredAt: '2026-05-04T10:00:00Z', featureArea: 'quran' }),
      ev({ eventType: 'evidence_created', occurredAt: '2026-05-05T10:00:00Z', featureArea: 'portfolio' }),
      ev({ eventType: 'report_generated', occurredAt: '2026-05-06T10:00:00Z', featureArea: 'reports' }),
    ]
    const summary = computeSummaryFromEvents(events, [], '2026-05-01', '2026-05-31')
    expect(summary.activeUsers).toBe(1)
    expect(summary.activeFamilies).toBe(1)
    expect(summary.learnersCreated).toBe(1)
    expect(summary.completionEvents).toBe(1)
    expect(summary.deenRecordsCreated).toBe(1)
    expect(summary.evidenceItemsCreated).toBe(1)
    expect(summary.reportsGenerated).toBe(1)
  })
})

describe('buildUserRow', () => {
  test('detects started not completed', () => {
    const periodEvents = [
      ev({ eventType: 'session_started', occurredAt: '2026-05-10T10:00:00Z', featureArea: 'planner' }),
    ]
    const row = buildUserRow(snapshot, periodEvents, [], '2026-05-01', '2026-05-31')
    expect(row.startedNotCompletedCount).toBe(1)
    expect(row.dropOffSignals).toContain('started_not_completed')
  })

  test('passes through learner names and lesson stats', () => {
    const row = buildUserRow(snapshot, [], [], '2026-05-01', '2026-05-31')
    expect(row.learnerNames).toEqual(['Ada', 'Bob'])
    expect(row.lessonTasksInPeriod).toBe(3)
    expect(row.lessonsCompletedInPeriod).toBe(1)
  })

  test('detects learners no activity', () => {
    const row = buildUserRow(snapshot, [], [], '2026-05-01', '2026-05-31')
    expect(row.dropOffSignals).toContain('learners_no_activity')
  })
})

describe('computeDropOffSignals', () => {
  test('flags activity without evidence', () => {
    const periodEvents = [
      ev({ eventType: 'lesson_completed', occurredAt: '2026-05-10T10:00:00Z', featureArea: 'planner' }),
    ]
    const signals = computeDropOffSignals(periodEvents, periodEvents, snapshot, '2026-05-31')
    expect(signals).toContain('activity_no_evidence')
  })
})

describe('filterAndSortUserRows', () => {
  test('filters by drop-off signal', () => {
    const rows = [
      buildUserRow(snapshot, [], [], '2026-05-01', '2026-05-31'),
      buildUserRow(
        { ...snapshot, householdId: 'hh_2' },
        [ev({ eventType: 'lesson_completed', occurredAt: '2026-05-15T10:00:00Z', featureArea: 'planner' })],
        [],
        '2026-05-01',
        '2026-05-31',
      ),
    ]
    const filtered = filterAndSortUserRows(rows, {
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      dropOff: 'learners_no_activity',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].workspaceId).toBe('hh_1')
  })

  test('filters by search on workspace name and email', () => {
    const rows = [
      buildUserRow(snapshot, [], [], '2026-05-01', '2026-05-31'),
      buildUserRow(
        {
          ...snapshot,
          householdId: 'hh_2',
          householdName: 'Other Family',
          userEmail: 'other@test.com',
          learnerNames: ['Zara'],
        },
        [],
        [],
        '2026-05-01',
        '2026-05-31',
      ),
    ]
    const byName = filterAndSortUserRows(rows, {
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      search: 'test family',
    })
    expect(byName).toHaveLength(1)
    expect(byName[0].workspaceName).toBe('Test Family')

    const byEmail = filterAndSortUserRows(rows, {
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      search: 'OTHER@TEST',
    })
    expect(byEmail).toHaveLength(1)
    expect(byEmail[0].userEmail).toBe('other@test.com')

    const byLearner = filterAndSortUserRows(rows, {
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
      search: 'ada',
    })
    expect(byLearner).toHaveLength(1)
    expect(byLearner[0].learnerNames).toContain('Ada')
  })
})
