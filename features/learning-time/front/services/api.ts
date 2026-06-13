'use client'

import type { ApiResponse } from '@/features/lib/types'
import type { CreateSessionInput, LearningTimeSession, SessionListFilters, SessionTransitionInput } from '@/features/learning-time/types'

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

export const learningTimeApi = {
  createSession(input: CreateSessionInput): Promise<ApiResponse<LearningTimeSession>> {
    return apiFetch('/api/learning-time/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  transition(id: string, input: SessionTransitionInput): Promise<ApiResponse<LearningTimeSession>> {
    return apiFetch(`/api/learning-time/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  getActive(learnerId: string): Promise<ApiResponse<LearningTimeSession | null>> {
    const params = new URLSearchParams({ learnerId })
    return apiFetch(`/api/learning-time/sessions/active?${params.toString()}`)
  },

  list(filters: SessionListFilters = {}): Promise<ApiResponse<LearningTimeSession[]>> {
    const params = new URLSearchParams()
    if (filters.learnerId) params.set('learnerId', filters.learnerId)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    const qs = params.toString()
    return apiFetch(`/api/learning-time/sessions${qs ? `?${qs}` : ''}`)
  },
}
