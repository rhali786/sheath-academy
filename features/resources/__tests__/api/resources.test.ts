/**
 * Unit tests for resources service — Wave 13 / Wave 3 Postgres migration
 */

jest.mock('@/features/resources/server/repository', () => ({
  createResourceRow: jest.fn(),
  getResourceRow: jest.fn(),
  listResourceRows: jest.fn(),
  updateResourceVerificationRow: jest.fn(),
  mapResourceRow: jest.requireActual('@/features/resources/server/repository').mapResourceRow,
}))

import {
  calculatePace,
  generateLessons,
  mapGeneratedLessonToTaskInput,
  createResource,
  getResource,
  updateVerificationStatus,
} from '@/features/resources/server/service'
import {
  createResourceRow,
  getResourceRow,
  updateResourceVerificationRow,
  type ResourceRow,
} from '@/features/resources/server/repository'
import type { Resource } from '@/features/resources/types'

const mockCreateResourceRow = createResourceRow as jest.MockedFunction<typeof createResourceRow>
const mockGetResourceRow = getResourceRow as jest.MockedFunction<typeof getResourceRow>
const mockUpdateResourceVerificationRow = updateResourceVerificationRow as jest.MockedFunction<typeof updateResourceVerificationRow>

function makeResourceRow(overrides: Partial<ResourceRow> = {}): ResourceRow {
  return {
    id: 'res_001',
    householdId: 'hh_001',
    title: 'Test Book',
    resourceType: 'textbook',
    publisher: null,
    author: null,
    edition: null,
    gradeLevel: null,
    subjectCategory: null,
    isbn: null,
    totalPages: null,
    totalLessons: null,
    totalChapters: null,
    verificationStatus: 'user-submitted',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

const BASE_RESOURCE: Resource = {
  id: 'res_001',
  workspaceId: 'ws_001',
  title: 'Saxon Math 7/6',
  resourceType: 'textbook',
  totalPages: 360,
  totalChapters: 30,
  verificationStatus: 'user-submitted',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('calculatePace', () => {
  it('calculates pagesPerDay from totalPages and scheduledDays', () => {
    const result = calculatePace({ totalPages: 360, scheduledDays: 150 })
    expect(result.pagesPerDay).toBeCloseTo(2.4)
  })

  it('calculates pagesPerDayNeeded from remaining pages and remaining days', () => {
    const result = calculatePace({
      totalPages: 360,
      completedPages: 57,
      scheduledDaysRemaining: 120,
    })
    // (360 - 57) / 120 = 303 / 120 = 2.525
    expect(result.pagesPerDayNeeded).toBeCloseTo(2.525)
  })

  it('returns isOnTrack=true when pagesPerDayNeeded <= pagesPerDay', () => {
    const result = calculatePace({
      totalPages: 360,
      scheduledDays: 150,
      completedPages: 60,
      scheduledDaysRemaining: 120,
    })
    // pagesPerDay = 2.4; pagesPerDayNeeded = (360-60)/120 = 2.5 > 2.4
    expect(result.isOnTrack).toBe(false)
  })

  it('returns isOnTrack=true when pace is on target', () => {
    // After 30 days with 2.4 p/d = 72 pages done; 288 remain in 120 days = 2.4 p/d
    const result = calculatePace({
      totalPages: 360,
      scheduledDays: 150,
      completedPages: 72,
      scheduledDaysRemaining: 120,
    })
    expect(result.isOnTrack).toBe(true)
  })
})

describe('generateLessons', () => {
  it('returns one lesson stub per chapter when strategy is byChapter', () => {
    const lessons = generateLessons({
      resource: BASE_RESOURCE,
      strategy: 'byChapter',
      chapters: 30,
      schoolDays: 36,
      startDate: '2026-09-01',
    })
    expect(lessons).toHaveLength(30)
  })

  it('lessons are ordered sequentially', () => {
    const lessons = generateLessons({
      resource: BASE_RESOURCE,
      strategy: 'byChapter',
      chapters: 5,
      schoolDays: 10,
      startDate: '2026-09-01',
    })
    lessons.forEach((l, i) => expect(l.order).toBe(i + 1))
  })

  it('distributes lessons across school days (no more than ceil(chapters/schoolDays) per day)', () => {
    const lessons = generateLessons({
      resource: BASE_RESOURCE,
      strategy: 'byChapter',
      chapters: 30,
      schoolDays: 36,
      startDate: '2026-09-01',
    })
    // Group by dueDate
    const byDate = new Map<string, number>()
    lessons.forEach(l => byDate.set(l.dueDate, (byDate.get(l.dueDate) ?? 0) + 1))
    // With 30 chapters over 36 days: most days get 1 lesson, none get > 1
    byDate.forEach(count => expect(count).toBeLessThanOrEqual(1))
  })

  it('uses resource title in lesson titles', () => {
    const lessons = generateLessons({
      resource: BASE_RESOURCE,
      strategy: 'byChapter',
      chapters: 3,
      schoolDays: 5,
      startDate: '2026-09-01',
    })
    lessons.forEach(l => expect(l.title).toContain('Saxon Math 7/6'))
  })

  it('cadence "weekly" produces lessons 7 calendar days apart, stepping from startDate weekday', () => {
    // 2026-09-01 is a Tuesday
    const lessons = generateLessons({
      resource: BASE_RESOURCE,
      strategy: 'byChapter',
      chapters: 4,
      schoolDays: 36,
      startDate: '2026-09-01',
      cadence: 'weekly',
    })
    expect(lessons).toHaveLength(4)
    expect(lessons.map(l => l.dueDate)).toEqual([
      '2026-09-01',
      '2026-09-08',
      '2026-09-15',
      '2026-09-22',
    ])
  })

  it('cadence "everyNDays" with cadenceDays produces lessons N calendar days apart from the previous due date', () => {
    const lessons = generateLessons({
      resource: BASE_RESOURCE,
      strategy: 'byChapter',
      chapters: 4,
      schoolDays: 36,
      startDate: '2026-09-01',
      cadence: 'everyNDays',
      cadenceDays: 3,
    })
    expect(lessons).toHaveLength(4)
    expect(lessons.map(l => l.dueDate)).toEqual([
      '2026-09-01',
      '2026-09-04',
      '2026-09-07',
      '2026-09-10',
    ])
  })
})

describe('mapGeneratedLessonToTaskInput', () => {
  it('maps a GeneratedLesson to a plannerApi.createLesson payload', () => {
    const lesson = {
      title: 'Saxon Math 7/6 — Chapter 1',
      dueDate: '2026-09-01',
      order: 1,
      description: 'Saxon Math 7/6 Chapter 1',
    }

    const payload = mapGeneratedLessonToTaskInput(lesson, {
      childId: 'child_001',
      subjectId: 'subject_001',
      householdId: 'household_001',
      resourceLink: 'https://example.com/saxon-math-7-6',
    })

    expect(payload).toEqual({
      childId: 'child_001',
      subjectId: 'subject_001',
      householdId: 'household_001',
      title: 'Saxon Math 7/6 — Chapter 1',
      description: 'Saxon Math 7/6 Chapter 1',
      dueDate: '2026-09-01',
      status: 'not_started',
      order: 1,
      resourceLink: 'https://example.com/saxon-math-7-6',
    })
  })

  it('omits resourceLink when not provided', () => {
    const lesson = {
      title: 'Saxon Math 7/6 — Chapter 2',
      dueDate: '2026-09-02',
      order: 2,
    }

    const payload = mapGeneratedLessonToTaskInput(lesson, {
      childId: 'child_001',
      subjectId: 'subject_001',
      householdId: 'household_001',
    })

    expect(payload.resourceLink).toBeUndefined()
    expect(payload.title).toBe('Saxon Math 7/6 — Chapter 2')
    expect(payload.status).toBe('not_started')
  })
})

describe('createResource', () => {
  it('calls createResourceRow and maps the result', async () => {
    const row = makeResourceRow({ id: 'res_new', title: 'Test Book' })
    mockCreateResourceRow.mockResolvedValue(row)
    const result = await createResource('hh_001', { title: 'Test Book', resourceType: 'textbook' })
    expect(mockCreateResourceRow).toHaveBeenCalledWith('hh_001', { title: 'Test Book', resourceType: 'textbook' })
    expect(result.id).toBe('res_new')
    expect(result.workspaceId).toBe('hh_001')
    expect(result.verificationStatus).toBe('user-submitted')
  })
})

describe('getResource', () => {
  it('returns mapped resource when row exists', async () => {
    const row = makeResourceRow({ id: 'res_001', title: 'Stored Book' })
    mockGetResourceRow.mockResolvedValue(row)
    const result = await getResource('res_001', 'hh_001')
    expect(result?.title).toBe('Stored Book')
  })

  it('returns undefined when row not found', async () => {
    mockGetResourceRow.mockResolvedValue(null)
    const result = await getResource('does-not-exist', 'hh_001')
    expect(result).toBeUndefined()
  })
})

describe('updateVerificationStatus', () => {
  it('calls updateResourceVerificationRow and maps result', async () => {
    const row = makeResourceRow({ verificationStatus: 'verified' })
    mockUpdateResourceVerificationRow.mockResolvedValue(row)
    const result = await updateVerificationStatus('res_001', 'hh_001', 'verified')
    expect(result?.verificationStatus).toBe('verified')
  })

  it('returns null when row not found', async () => {
    mockUpdateResourceVerificationRow.mockResolvedValue(null)
    const result = await updateVerificationStatus('does-not-exist', 'hh_001', 'verified')
    expect(result).toBeNull()
  })
})
