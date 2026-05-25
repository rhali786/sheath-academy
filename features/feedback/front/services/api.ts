import type { FeedbackSubmitInput, FeedbackRow } from '@/features/feedback/types'

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

export async function listAdminFeedback(): Promise<FeedbackRow[]> {
  const res = await fetch('/api/admin/feedback')
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
