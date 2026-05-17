import axios from 'axios'
import type { ApiResponse, Task, DashboardMetrics, QuranSession, DashboardRecord, Alert } from '@/features/lib/types'

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const dashboardApi = {
  health: async () => {
    const response = await api.get('/api/health')
    return response.data
  },

  getSummary: async (childId?: string): Promise<ApiResponse<DashboardMetrics>> => {
    const params = childId ? `?childId=${encodeURIComponent(childId)}` : ''
    const response = await api.get(`/api/dashboard/summary${params}`)
    return response.data
  },

  getTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get('/api/dashboard/tasks')
    return response.data
  },

  completeTask: async (taskId: string, completed: boolean): Promise<any> => {
    const response = await api.post(`/api/dashboard/tasks/${taskId}/complete`, { completed })
    return response.data
  },

  getProgress: async (): Promise<any> => {
    const response = await api.get('/api/dashboard/progress')
    return response.data
  },

  getQuran: async (childId?: string): Promise<any> => {
    const params = childId ? `?childId=${encodeURIComponent(childId)}` : ''
    const response = await api.get(`/api/dashboard/quran${params}`)
    return response.data
  },

  addQuranSession: async (session: any): Promise<ApiResponse<QuranSession>> => {
    const response = await api.post('/api/dashboard/quran', session)
    return response.data
  },

  getRecords: async (childId?: string): Promise<ApiResponse<DashboardRecord[]>> => {
    const params = childId ? `?childId=${encodeURIComponent(childId)}` : ''
    const response = await api.get(`/api/dashboard/records${params}`)
    return response.data
  },

  getAlerts: async (): Promise<ApiResponse<Alert[]>> => {
    const response = await api.get('/api/dashboard/alerts')
    return response.data
  },
}

export default api
