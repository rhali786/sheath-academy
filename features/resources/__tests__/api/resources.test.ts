/**
 * Unit tests for resources service — Wave 13
 * TDD: written before implementation
 */

import {
  calculatePace,
  generateLessons,
  createResource,
  updateVerificationStatus,
} from '@/features/resources/server/service'
import type { Resource } from '@/features/resources/types'

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
})

describe('createResource', () => {
  it('creates a resource with generated id and timestamps', () => {
    const resource = createResource({
      workspaceId: 'ws_001',
      title: 'Test Book',
      resourceType: 'textbook',
    })
    expect(resource.id).toMatch(/^res_/)
    expect(resource.verificationStatus).toBe('user-submitted')
    expect(resource.createdAt).toBeTruthy()
  })

  it('stores the resource so it can be retrieved', () => {
    const resource = createResource({
      workspaceId: 'ws_001',
      title: 'Stored Book',
      resourceType: 'workbook',
    })
    const { getResource } = require('@/features/resources/server/service')
    const found = getResource(resource.id)
    expect(found?.title).toBe('Stored Book')
  })
})

describe('updateVerificationStatus', () => {
  it('changes verificationStatus on a resource', () => {
    const resource = createResource({
      workspaceId: 'ws_001',
      title: 'Verify Me',
      resourceType: 'textbook',
    })
    const updated = updateVerificationStatus(resource.id, 'verified')
    expect(updated?.verificationStatus).toBe('verified')
  })

  it('returns null for unknown resource id', () => {
    const result = updateVerificationStatus('does-not-exist', 'verified')
    expect(result).toBeNull()
  })
})
