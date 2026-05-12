import { handlePlannerRoute } from '@/features/planner/api/router'

describe('GET /api/planner/lessons', () => {
  it('returns all lessons for a given week when no filters provided')
  it('returns empty array when no lessons exist for that week')
  it('filters lessons by childId when childIds query param provided')
  it('filters lessons by subjectId when subjectIds query param provided')
  it('filters by both childIds and subjectIds when both provided')
  it('returns 400 when week param is not a valid ISO date')
  it('respects weekStartDay from household profile when calculating week span')
})
