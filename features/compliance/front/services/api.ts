import type { ApiResponse } from '@/features/lib/types'
import type {
  StatusEngineResult,
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceSubmission,
  SubmissionStatus,
} from '@/features/compliance/types'

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

export interface DeadlineInput {
  schoolYearId: string
  label: string
  dueDate: string
  requirementType: string
}

export type DeadlinePatch = Partial<Pick<ComplianceDeadline, 'label' | 'dueDate' | 'requirementType' | 'isCompleted'>>

export const complianceApi = {
  getStatus: async (_householdId: string, schoolYearId: string): Promise<ApiResponse<StatusEngineResult>> => {
    return get<StatusEngineResult>(`/api/compliance/status?schoolYearId=${encodeURIComponent(schoolYearId)}`)
  },

  getRuleset: async (_householdId: string): Promise<ApiResponse<ComplianceRuleset | null>> => {
    return get<ComplianceRuleset | null>('/api/compliance/ruleset')
  },

  getDeadlines: async (_householdId: string, schoolYearId: string): Promise<ApiResponse<ComplianceDeadline[]>> => {
    return get<ComplianceDeadline[]>(`/api/compliance/deadlines?schoolYearId=${encodeURIComponent(schoolYearId)}`)
  },

  getSubmissions: async (_householdId: string, schoolYearId: string): Promise<ApiResponse<ComplianceSubmission[]>> => {
    return get<ComplianceSubmission[]>(`/api/compliance/submissions?schoolYearId=${encodeURIComponent(schoolYearId)}`)
  },

  getRulesets: async (): Promise<ApiResponse<ComplianceRuleset[]>> => {
    return get<ComplianceRuleset[]>('/api/compliance/rulesets')
  },

  /** Resolves the household's active school year id (needed to scope writable records). */
  getActiveSchoolYearId: async (): Promise<string | null> => {
    const res = await get<{ id: string } | null>('/api/school-years/active')
    return res.data?.id ?? null
  },

  createDeadline: async (input: DeadlineInput): Promise<ApiResponse<ComplianceDeadline | null>> => {
    return mutate<ComplianceDeadline | null>('/api/compliance/deadlines', 'POST', input)
  },

  updateDeadline: async (id: string, patch: DeadlinePatch): Promise<ApiResponse<ComplianceDeadline | null>> => {
    return mutate<ComplianceDeadline | null>(`/api/compliance/deadlines/${encodeURIComponent(id)}`, 'PATCH', patch)
  },

  deleteDeadline: async (id: string): Promise<ApiResponse<null>> => {
    return mutate<null>(`/api/compliance/deadlines/${encodeURIComponent(id)}`, 'DELETE')
  },

  createSubmission: async (schoolYearId: string, status?: SubmissionStatus): Promise<ApiResponse<ComplianceSubmission | null>> => {
    return mutate<ComplianceSubmission | null>('/api/compliance/submissions', 'POST', { schoolYearId, status })
  },

  updateSubmissionStatus: async (id: string, status: SubmissionStatus): Promise<ApiResponse<ComplianceSubmission | null>> => {
    return mutate<ComplianceSubmission | null>(`/api/compliance/submissions/${encodeURIComponent(id)}`, 'PATCH', { status })
  },

  deleteSubmission: async (id: string): Promise<ApiResponse<null>> => {
    return mutate<null>(`/api/compliance/submissions/${encodeURIComponent(id)}`, 'DELETE')
  },

  setConfig: async (input: { activeRulesetId?: string | null; pathwayKey?: string | null }): Promise<ApiResponse<null>> => {
    return mutate<null>('/api/compliance/config', 'PUT', input)
  },
}
