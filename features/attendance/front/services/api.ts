'use client'

import type { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '@/features/attendance/types'
import type { ApiResponse } from '@/features/lib/types'

function getBase(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return `http://127.0.0.1:${process.env.PORT ?? '3000'}`
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${getBase()}${path}`, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

interface RecordFilters {
  childId?: string
  date?: string
  startDate?: string
  endDate?: string
}

export const attendanceApi = {
  getRecords(filters: RecordFilters = {}): Promise<ApiResponse<AttendanceRecord[]>> {
    const params = new URLSearchParams()
    if (filters.childId) params.set('childId', filters.childId)
    if (filters.date) params.set('date', filters.date)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    const qs = params.toString()
    return apiFetch(`/api/attendance${qs ? `?${qs}` : ''}`)
  },

  createRecord(data: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<AttendanceRecord>> {
    return apiFetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  updateRecord(id: string, patch: Partial<AttendanceRecord>): Promise<ApiResponse<AttendanceRecord>> {
    return apiFetch(`/api/attendance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  },

  archiveRecord(id: string): Promise<ApiResponse<null>> {
    return apiFetch(`/api/attendance/${id}`, { method: 'DELETE' })
  },

  batchRecord(data: {
    date: string
    householdId: string
    entries: Array<{ childId: string; status: AttendanceStatus }>
  }): Promise<ApiResponse<AttendanceRecord[]>> {
    return apiFetch('/api/attendance/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  getSummary(childId: string, startDate?: string, endDate?: string): Promise<ApiResponse<AttendanceSummary>> {
    const params = new URLSearchParams({ childId })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    return apiFetch(`/api/attendance/summary?${params.toString()}`)
  },
}
