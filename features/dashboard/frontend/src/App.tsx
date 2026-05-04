import React, { createContext, useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import { dashboardApi } from './services/api'
import type { Task, Alert, QuranSession, DashboardRecord, Child, DashboardMetrics } from './types'

export interface DashboardContextType {
  children: Child[]
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
  quranSessions: QuranSession[]
  setQuranSessions: (sessions: QuranSession[]) => void
  records: DashboardRecord[]
  setRecords: (records: DashboardRecord[]) => void
  metrics: DashboardMetrics | null
  setMetrics: (metrics: DashboardMetrics) => void
  toggleTask: (taskId: string, completed: boolean) => Promise<void>
  addQuranSession: (session: any) => Promise<void>
  loading: boolean
  error: string | null
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function useContext_Dashboard() {
  const context = React.useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return context
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([])
  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const children: Child[] = [
    { id: 'adam_001', name: 'Adam', age: 11, grade: 5, avatar: 'A' },
    { id: 'khadijah_001', name: 'Khadijah', age: 8, grade: 3, avatar: 'K' },
    { id: 'zayd_001', name: 'Zayd', age: 14, grade: 8, avatar: 'Z' },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, alertsRes, quranRes, recordsRes, summaryRes] = await Promise.all([
          dashboardApi.getTasks(),
          dashboardApi.getAlerts(),
          dashboardApi.getQuran(),
          dashboardApi.getRecords(),
          dashboardApi.getSummary(),
        ])

        setTasks(tasksRes.data)
        setAlerts(alertsRes.data)
        setQuranSessions(quranRes.data.sessions)
        setRecords(recordsRes.data)
        setMetrics(summaryRes.data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await dashboardApi.completeTask(taskId, completed)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed } : t))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const addQuranSession = async (session: any) => {
    try {
      const res = await dashboardApi.addQuranSession(session)
      setQuranSessions([...quranSessions, res.data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add Quran session')
    }
  }

  const value: DashboardContextType = {
    children,
    tasks,
    setTasks,
    alerts,
    setAlerts,
    quranSessions,
    setQuranSessions,
    records,
    setRecords,
    metrics,
    setMetrics,
    toggleTask,
    addQuranSession,
    loading,
    error,
  }

  return (
    <DashboardContext.Provider value={value}>
      <Dashboard />
    </DashboardContext.Provider>
  )
}

export default App
