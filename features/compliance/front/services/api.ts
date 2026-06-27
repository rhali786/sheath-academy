import type { ApiResponse } from '@/features/lib/types'
import type {
  StatusEngineResult,
  ComplianceRuleset,
  ComplianceDeadline,
  ComplianceSubmission,
} from '@/features/compliance/types'
import {
  mockStatusResult,
  mockRuleset,
  mockDeadlines,
  mockSubmissions,
} from '@/features/compliance/__tests__/fixtures/mockCompliance'

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: 'ok', timestamp: new Date().toISOString() }
}

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const complianceApi = {
  /** Returns computed compliance status (Layer 1: fixture-backed; Layer 3: real). */
  getStatus: async (_householdId: string, _schoolYearId: string): Promise<ApiResponse<StatusEngineResult>> => {
    await tick()
    return ok(mockStatusResult)
  },

  /** Returns the active ruleset for the household's state + pathway. */
  getRuleset: async (_householdId: string): Promise<ApiResponse<ComplianceRuleset | null>> => {
    await tick()
    return ok(mockRuleset)
  },

  /** Returns upcoming and past compliance deadlines. */
  getDeadlines: async (_householdId: string, _schoolYearId: string): Promise<ApiResponse<ComplianceDeadline[]>> => {
    await tick()
    return ok(mockDeadlines)
  },

  /** Returns submission tracker entries. */
  getSubmissions: async (_householdId: string, _schoolYearId: string): Promise<ApiResponse<ComplianceSubmission[]>> => {
    await tick()
    return ok(mockSubmissions)
  },
}
