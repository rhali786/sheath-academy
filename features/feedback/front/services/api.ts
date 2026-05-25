import type { AdminFeedbackFilters, FeedbackSubmitInput, FeedbackRow } from '@/features/feedback/types'

export async function submitFeedback(input: FeedbackSubmitInput): Promise<void> {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? 'Failed to submit feedback')
  }
}

export async function listUserFeedback(): Promise<FeedbackRow[]> {
  const res = await fetch('/api/feedback')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? 'Failed to load feedback')
  }
  const body = await res.json()
  return (body as { data: FeedbackRow[] }).data
}

export async function getUserFeedback(id: string): Promise<FeedbackRow> {
  const res = await fetch(`/api/feedback/${id}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? 'Not found')
  }
  const body = await res.json()
  return (body as { data: FeedbackRow }).data
}

export async function approveAdminFeedback(id: string): Promise<void> {
  const res = await fetch(`/api/admin/feedback/${id}/approve`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? 'Approval failed')
  }
}

export async function listAdminFeedback(filters: Partial<AdminFeedbackFilters> = {}): Promise<FeedbackRow[]> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.confidence) params.set('confidence', filters.confidence)
  if (filters.riskLevel) params.set('riskLevel', filters.riskLevel)
  if (filters.feedbackType) params.set('feedbackType', filters.feedbackType)
  if (filters.featureArea) params.set('featureArea', filters.featureArea)
  if (filters.prNumber !== undefined) params.set('prNumber', String(filters.prNumber))
  if (filters.hasDuplicate === true) params.set('hasDuplicate', 'true')

  const query = params.toString()
  const res = await fetch(query ? `/api/admin/feedback?${query}` : '/api/admin/feedback')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = Object.assign(
      new Error((body as { message?: string }).message ?? 'Failed to load feedback'),
      { status: res.status },
    )
    throw err
  }
  const body = await res.json()
  return (body as { data: FeedbackRow[] }).data
}
