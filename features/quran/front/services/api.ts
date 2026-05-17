import type { ApiResponse, QuranSession, ChartSeries, QuranSessionRequest } from '@/features/lib/types'
import type { QuranSummary } from '@/features/quran/server/service'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

export const quranApi = {
  getSessions: async (childId?: string): Promise<ApiResponse<{ sessions: QuranSession[]; chartData: ChartSeries[] }>> => {
    const params = childId ? `?childId=${encodeURIComponent(childId)}` : ''
    const res = await fetch(`${getApiBaseUrl()}/api/quran/sessions${params}`)
    if (!res.ok) throw new Error('Failed to fetch quran sessions')
    return res.json()
  },

  addSession: async (session: QuranSessionRequest): Promise<ApiResponse<QuranSession>> => {
    const res = await fetch(`${getApiBaseUrl()}/api/quran/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
    if (!res.ok) throw new Error('Failed to add quran session')
    return res.json()
  },

  getSummary: async ({
    childId,
    startDate,
    endDate,
  }: {
    childId?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<ApiResponse<QuranSummary>> => {
    const params = new URLSearchParams()
    if (childId) params.set('childId', childId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`${getApiBaseUrl()}/api/quran/summary${query}`)
    if (!res.ok) throw new Error('Failed to fetch quran summary')
    return res.json()
  },
}
