'use client'

import React, { createContext, useState, useEffect, ReactNode } from 'react'
import type { Task, Alert, QuranSession, DashboardRecord, DashboardMetrics, StudentProfile } from '@/features/lib/types'
import { dashboardApi } from '@/features/dashboard/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'

export interface DashboardContextType {
  children: StudentProfile[]
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

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([])
  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, alertsRes, quranRes, recordsRes, summaryRes, childrenRes] = await Promise.all([
          dashboardApi.getTasks(),
          dashboardApi.getAlerts(),
          dashboardApi.getQuran(),
          dashboardApi.getRecords(),
          dashboardApi.getSummary(),
          childrenApi.getAllChildren(),
        ])

        setTasks(tasksRes.data)
        setAlerts(alertsRes.data)
        setQuranSessions(quranRes.data.sessions)
        setRecords(recordsRes.data)
        setMetrics(summaryRes.data)
        setStudentProfiles(childrenRes.data)
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
    children: studentProfiles,
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
      {children}
    </DashboardContext.Provider>
  )
}
