import type { ApiResponse } from '@/features/lib/types'
import type {
  StatusEngineResult,
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceSubmission,
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
}
