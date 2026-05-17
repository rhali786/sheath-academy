import type { ApiResponse, Alert } from '@/features/lib/types'

export const alertsApi = {
  async getAlerts(childId?: string): Promise<ApiResponse<Alert[]>> {
    const params = childId ? `?childId=${childId}` : ''
    const res = await fetch(`/api/alerts${params}`)
    if (!res.ok) throw new Error('Failed to fetch alerts')
    return res.json()
  },
}
