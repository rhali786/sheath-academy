'use client'

import type { ApiResponse } from '@/features/lib/types'
import type { RecordsReport } from '@/features/reports/types'

function getBase(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return `http://127.0.0.1:${process.env.PORT ?? '3000'}`
}

async function apiFetch<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getBase()}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

export const reportsApi = {
  getRecordsReport(filters: {
    childId: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<RecordsReport>> {
    const params = new URLSearchParams({ childId: filters.childId })
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    return apiFetch(`/api/reports/summary?${params.toString()}`)
  },
}
