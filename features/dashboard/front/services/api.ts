import axios from 'axios'
import type { ApiResponse, Task, DashboardMetrics, QuranSession, DashboardRecord, Alert } from '@/features/lib/types'

// Use window.location.origin for client-side, or default to localhost for server-side
const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

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

  getSummary: async (): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await api.get('/api/dashboard/summary')
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

  getQuran: async (): Promise<any> => {
    const response = await api.get('/api/dashboard/quran')
    return response.data
  },

  addQuranSession: async (session: any): Promise<ApiResponse<QuranSession>> => {
    const response = await api.post('/api/dashboard/quran', session)
    return response.data
  },

  getRecords: async (): Promise<ApiResponse<DashboardRecord[]>> => {
    const response = await api.get('/api/dashboard/records')
    return response.data
  },

  getAlerts: async (): Promise<ApiResponse<Alert[]>> => {
    const response = await api.get('/api/dashboard/alerts')
    return response.data
  },
}

export default api
