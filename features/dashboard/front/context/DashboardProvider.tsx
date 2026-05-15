'use client'

import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { Task, Alert, QuranSession, DashboardRecord, DashboardMetrics, StudentProfile } from '@/features/lib/types'
import { dashboardApi } from '@/features/dashboard/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'
import { useSelectedChild } from '@/features/dashboard/front/hooks/useSelectedChild'
import { useHousehold } from '@/features/household/front/context'

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
  selectedChildId: string | null
  setSelectedChildId: (id: string | null) => void
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
  const { workspace, householdProfile, loading: householdLoading } = useHousehold()
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [allAlerts, setAllAlerts] = useState<Alert[]>([])
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([])
  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChildId, setSelectedChildId] = useSelectedChild()

  useEffect(() => {
    if (householdLoading) return

    const fetchData = async () => {
      try {
        const householdId = householdProfile?.id ?? workspace?.id
        const childrenPromise = householdId
          ? childrenApi.getChildren(householdId, false)
          : Promise.resolve({
              data: [] as StudentProfile[],
              status: 'success' as const,
              message: '',
              timestamp: '',
            })

        const [tasksRes, alertsRes, quranRes, recordsRes, summaryRes, childrenRes] = await Promise.all([
          dashboardApi.getTasks(),
          dashboardApi.getAlerts(),
          dashboardApi.getQuran(),
          dashboardApi.getRecords(),
          dashboardApi.getSummary(),
          childrenPromise,
        ])

        setAllTasks(tasksRes.data)
        setAllAlerts(alertsRes.data)
        setQuranSessions(quranRes.data.sessions)
        setRecords(recordsRes.data)
        setMetrics(summaryRes.data)
        setStudentProfiles(childrenRes.data ?? [])
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        setLoading(false)
      }
    }

    void fetchData()
  }, [workspace?.id, householdProfile?.id, householdLoading])

  useEffect(() => {
    if (!selectedChildId && studentProfiles.length > 0) {
      setSelectedChildId(studentProfiles[0].id)
    }
  }, [studentProfiles, selectedChildId, setSelectedChildId])

  const tasks = useMemo(() => {
    if (!selectedChildId) {
      return allTasks
    }
    return allTasks.filter(
      (t) => t.childId === selectedChildId || t.childId === 'family'
    )
  }, [allTasks, selectedChildId])

  const alerts = useMemo(() => {
    if (!selectedChildId) {
      return allAlerts
    }
    return allAlerts.filter(
      (a) => a.childId === selectedChildId || a.childId === null
    )
  }, [allAlerts, selectedChildId])

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await dashboardApi.completeTask(taskId, completed)
      setAllTasks(allTasks.map((t) => (t.id === taskId ? { ...t, completed } : t)))
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
    setTasks: setAllTasks,
    alerts,
    setAlerts: setAllAlerts,
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
    selectedChildId,
    setSelectedChildId,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
