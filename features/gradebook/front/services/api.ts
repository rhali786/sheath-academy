import type { ApiResponse } from '@/features/lib/types'
import type { GradebookSummary, Score, SubjectGradeResult, NeedsAttentionItem, ScoreState, GradingScale, GradingScaleBand, AggregationRule, AggregationStrategy, SubjectCourseConfig } from '@/features/gradebook/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return `http://127.0.0.1:${process.env.PORT ?? '3000'}`
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function mutate<T>(path: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export interface ScoreInput {
  learnerId: string
  subjectId: string
  state: ScoreState
  numericValue?: number | null
  occurredAt?: string
  comment?: string
  /** Links this score to a specific scheduled lesson/assignment. */
  lessonTaskId?: string
}

export type ScorePatch = Partial<Omit<ScoreInput, 'learnerId' | 'subjectId'>>

export const gradebookApi = {
  getSummaries: async (_householdId: string): Promise<ApiResponse<GradebookSummary[]>> => {
    return get<GradebookSummary[]>('/api/gradebook/summaries')
  },

  getScores: async (_learnerId: string, subjectId: string, learnerId = _learnerId): Promise<ApiResponse<Score[]>> => {
    return get<Score[]>(`/api/gradebook/scores?learnerId=${encodeURIComponent(learnerId)}&subjectId=${encodeURIComponent(subjectId)}`)
  },

  createScore: async (input: ScoreInput): Promise<ApiResponse<Score | null>> => {
    return mutate<Score | null>('/api/gradebook/scores', 'POST', input)
  },

  updateScore: async (id: string, patch: ScorePatch): Promise<ApiResponse<Score | null>> => {
    return mutate<Score | null>(`/api/gradebook/scores/${encodeURIComponent(id)}`, 'PATCH', patch)
  },

  deleteScore: async (id: string): Promise<ApiResponse<null>> => {
    return mutate<null>(`/api/gradebook/scores/${encodeURIComponent(id)}`, 'DELETE')
  },

  // ─── Grading scales (Phase 6) ──────────────────────────────────────────────
  getGradingScales: async (): Promise<ApiResponse<GradingScale[]>> => get<GradingScale[]>('/api/gradebook/grading-scales'),
  createGradingScale: async (name: string, bands: GradingScaleBand[]): Promise<ApiResponse<GradingScale | null>> =>
    mutate<GradingScale | null>('/api/gradebook/grading-scales', 'POST', { name, bands }),
  updateGradingScale: async (id: string, patch: { name?: string; bands?: GradingScaleBand[] }): Promise<ApiResponse<GradingScale | null>> =>
    mutate<GradingScale | null>(`/api/gradebook/grading-scales/${encodeURIComponent(id)}`, 'PATCH', patch),
  deleteGradingScale: async (id: string): Promise<ApiResponse<null>> =>
    mutate<null>(`/api/gradebook/grading-scales/${encodeURIComponent(id)}`, 'DELETE'),

  // ─── Aggregation rules (Phase 6) ───────────────────────────────────────────
  getAggregationRules: async (): Promise<ApiResponse<AggregationRule[]>> => get<AggregationRule[]>('/api/gradebook/aggregation-rules'),
  createAggregationRule: async (name: string, strategy: AggregationStrategy): Promise<ApiResponse<AggregationRule | null>> =>
    mutate<AggregationRule | null>('/api/gradebook/aggregation-rules', 'POST', { name, strategy }),
  updateAggregationRule: async (id: string, patch: { name?: string; strategy?: AggregationStrategy }): Promise<ApiResponse<AggregationRule | null>> =>
    mutate<AggregationRule | null>(`/api/gradebook/aggregation-rules/${encodeURIComponent(id)}`, 'PATCH', patch),
  deleteAggregationRule: async (id: string): Promise<ApiResponse<null>> =>
    mutate<null>(`/api/gradebook/aggregation-rules/${encodeURIComponent(id)}`, 'DELETE'),

  /**
   * Persists a subject's course-config. Writes through the subject's owner route
   * (PUT /api/subjects/:id) — gradebook does not own the subjects table.
   */
  updateSubjectConfig: async (subjectId: string, config: Partial<SubjectCourseConfig>): Promise<ApiResponse<unknown>> =>
    mutate<unknown>(`/api/subjects/${encodeURIComponent(subjectId)}`, 'PUT', config),

  getSubjectGrades: async (learnerId: string): Promise<ApiResponse<SubjectGradeResult[]>> => {
    const summaries = await get<GradebookSummary[]>('/api/gradebook/summaries')
    const summary = summaries.data.find(s => s.learnerId === learnerId)
    return {
      status: 'success',
      data: summary?.subjects ?? [],
      message: 'ok',
      timestamp: new Date().toISOString(),
    }
  },

  getNeedsAttention: async (learnerId: string): Promise<ApiResponse<NeedsAttentionItem[]>> => {
    const summaries = await get<GradebookSummary[]>('/api/gradebook/summaries')
    const summary = summaries.data.find(s => s.learnerId === learnerId)
    const items: NeedsAttentionItem[] = (summary?.needsAttentionSubjects ?? []).map(subjectId => {
      const sub = summary?.subjects.find(s => s.subjectId === subjectId)
      return {
        learnerId,
        subjectId,
        label: sub?.label ?? subjectId,
        reason: sub?.needsReview ? 'decaying' : sub?.pointsAverage === null ? 'no_scores' : 'missing',
      }
    })
    return {
      status: 'success',
      data: items,
      message: 'ok',
      timestamp: new Date().toISOString(),
    }
  },
}
