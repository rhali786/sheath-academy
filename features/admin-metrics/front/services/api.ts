import type {
  AdminMetricsSummary,
  AdminMetricsUsersResult,
  UsageEvent,
} from '@/features/admin-metrics/types'
import type { ApiResponse } from '@/features/lib/types'

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!res.ok || body.status === 'error') {
    const err = new Error(body.message || res.statusText) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return body.data as T
}

export const adminMetricsApi = {
  async getSummary(params?: { periodStart?: string; periodEnd?: string }): Promise<AdminMetricsSummary> {
    const url = new URL('/api/admin/metrics/summary', window.location.origin)
    if (params?.periodStart) url.searchParams.set('periodStart', params.periodStart)
    if (params?.periodEnd) url.searchParams.set('periodEnd', params.periodEnd)
    const res = await fetch(url.toString(), { credentials: 'include' })
    return parseJson<AdminMetricsSummary>(res)
  },

  async getUsers(params: {
    periodStart?: string
    periodEnd?: string
    page?: number
    activeOnly?: boolean
    featureArea?: string
    dropOff?: string
  }): Promise<AdminMetricsUsersResult> {
    const url = new URL('/api/admin/metrics/users', window.location.origin)
    if (params.periodStart) url.searchParams.set('periodStart', params.periodStart)
    if (params.periodEnd) url.searchParams.set('periodEnd', params.periodEnd)
    if (params.page) url.searchParams.set('page', String(params.page))
    if (params.activeOnly) url.searchParams.set('activeOnly', 'true')
    if (params.featureArea) url.searchParams.set('featureArea', params.featureArea)
    if (params.dropOff) url.searchParams.set('dropOff', params.dropOff)
    const res = await fetch(url.toString(), { credentials: 'include' })
    return parseJson<AdminMetricsUsersResult>(res)
  },

  async getEvents(params?: { periodStart?: string; periodEnd?: string; limit?: number }): Promise<UsageEvent[]> {
    const url = new URL('/api/admin/metrics/events', window.location.origin)
    if (params?.periodStart) url.searchParams.set('periodStart', params.periodStart)
    if (params?.periodEnd) url.searchParams.set('periodEnd', params.periodEnd)
    if (params?.limit) url.searchParams.set('limit', String(params.limit))
    const res = await fetch(url.toString(), { credentials: 'include' })
    return parseJson<UsageEvent[]>(res)
  },
}
