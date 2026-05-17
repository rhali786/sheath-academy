import type { ApiResponse, QuranSession, ChartSeries, QuranSessionRequest } from '@/features/lib/types'

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
}
