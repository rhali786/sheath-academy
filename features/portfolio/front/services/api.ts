'use client'

import type { EvidenceItem, CreateEvidenceItemInput } from '@/features/portfolio/types'
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

export const portfolioApi = {
  listEvidence(filters?: {
    childId?: string
    subjectId?: string
  }): Promise<ApiResponse<EvidenceItem[]>> {
    const params = new URLSearchParams()
    if (filters?.childId) params.set('childId', filters.childId)
    if (filters?.subjectId) params.set('subjectId', filters.subjectId)
    const qs = params.toString()
    return apiFetch(`/api/portfolio/evidence${qs ? `?${qs}` : ''}`)
  },

  getEvidence(id: string): Promise<ApiResponse<EvidenceItem>> {
    return apiFetch(`/api/portfolio/evidence/${id}`)
  },

  createEvidence(input: CreateEvidenceItemInput): Promise<ApiResponse<EvidenceItem>> {
    return apiFetch('/api/portfolio/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  },

  updateEvidence(
    id: string,
    patch: Partial<CreateEvidenceItemInput>
  ): Promise<ApiResponse<EvidenceItem>> {
    return apiFetch(`/api/portfolio/evidence/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  },

  deleteEvidence(id: string): Promise<ApiResponse<null>> {
    return apiFetch(`/api/portfolio/evidence/${id}`, { method: 'DELETE' })
  },

  listEvidenceByLessonTask(lessonTaskId: string): Promise<ApiResponse<EvidenceItem[]>> {
    const params = new URLSearchParams({ lessonTaskId })
    return apiFetch(`/api/portfolio/evidence?${params.toString()}`)
  },
}
