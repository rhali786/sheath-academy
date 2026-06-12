import { getTableColumns } from 'drizzle-orm'
import { learningTimeSessions } from '@/db/schema'

describe('learningTimeSessions table', () => {
  it('is defined and exported from db/schema', () => {
    expect(learningTimeSessions).toBeDefined()
  })

  it('defines the Phase 1 (time-only) columns', () => {
    const columns = getTableColumns(learningTimeSessions)
    const names = Object.keys(columns)

    const expected = [
      'id',
      'householdId',
      'learnerId',
      'subjectId',
      'lessonTaskId',
      'timeChannelType',
      'targetMinutes',
      'scheduledStart',
      'scheduledEnd',
      'status',
      'startedAt',
      'pausedAt',
      'endedAt',
      'endedBy',
      'outcome',
      'notes',
      'createdAt',
      'updatedAt',
    ]

    for (const col of expected) {
      expect(names).toContain(col)
    }
  })

  it('does NOT define a mode column in Phase 1 (time-only; mode is added in Phase 2)', () => {
    const names = Object.keys(getTableColumns(learningTimeSessions))
    expect(names).not.toContain('mode')
  })

  it('maps to the learning_time_sessions table name', () => {
    const columns = getTableColumns(learningTimeSessions)
    // householdId column maps to the household_id DB column
    expect(columns.householdId.name).toBe('household_id')
    expect(columns.timeChannelType.name).toBe('time_channel_type')
  })
})
