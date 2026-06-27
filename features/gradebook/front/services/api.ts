import type { ApiResponse } from '@/features/lib/types'
import type { GradebookSummary, Score, SubjectGradeResult, NeedsAttentionItem } from '@/features/gradebook/types'
import { mockGradebookSummaries, mockScores, laythNeedsAttention } from '@/features/gradebook/__tests__/fixtures/mockGradebook'

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: 'ok', timestamp: new Date().toISOString() }
}

export const gradebookApi = {
  /** Returns grade summaries for all learners in the household. */
  getSummaries: async (_householdId: string): Promise<ApiResponse<GradebookSummary[]>> => {
    await tick()
    return ok(mockGradebookSummaries)
  },

  /** Returns all scores for a specific subject + learner. */
  getScores: async (_learnerId: string, _subjectId: string): Promise<ApiResponse<Score[]>> => {
    await tick()
    return ok(mockScores.filter(s => s.learnerId === _learnerId && s.subjectId === _subjectId))
  },

  /** Returns subject grade results for a specific learner. */
  getSubjectGrades: async (learnerId: string): Promise<ApiResponse<SubjectGradeResult[]>> => {
    await tick()
    const summary = mockGradebookSummaries.find(s => s.learnerId === learnerId)
    return ok(summary?.subjects ?? [])
  },

  /** Returns the "needs attention" list for a learner. */
  getNeedsAttention: async (learnerId: string): Promise<ApiResponse<NeedsAttentionItem[]>> => {
    await tick()
    void learnerId
    return ok(laythNeedsAttention)
  },
}

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}
