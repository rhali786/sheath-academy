'use client'

import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { Task, Alert, QuranSession, DashboardRecord, DashboardMetrics, StudentProfile, NivoLineSeries } from '@/features/lib/types'
import { dashboardApi } from '@/features/dashboard/front/services/api'
import { alertsApi } from '@/features/alerts/front/services/api'
import { quranApi } from '@/features/quran/front/services/api'
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
  quranChartData: NivoLineSeries[]
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
  const [quranChartData, setQuranChartData] = useState<NivoLineSeries[]>([])
  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedChildId, setSelectedChildId] = useSelectedChild()

  // Initial load: fetch base data (children, tasks, alerts) plus child-agnostic data
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
          alertsApi.getAlerts(selectedChildId ?? undefined),
          quranApi.getSessions(selectedChildId ?? undefined),
          dashboardApi.getRecords(selectedChildId ?? undefined),
          dashboardApi.getSummary(selectedChildId ?? undefined),
          childrenPromise,
        ])

        setAllTasks(tasksRes.data)
        setAllAlerts(alertsRes.data)
        setQuranSessions(quranRes.data.sessions)
        setQuranChartData(quranRes.data.chartData ?? [])
        setRecords(recordsRes.data)
        setMetrics(summaryRes.data)
        setStudentProfiles(childrenRes.data ?? [])
        setLoading(false)
        setInitialLoadDone(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        setLoading(false)
      }
    }

    void fetchData()
    // selectedChildId intentionally excluded — re-fetch is handled by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, householdProfile?.id, householdLoading])

  // Re-fetch per-child data whenever selected child changes (after initial load)
  // Runs when selectedChildId changes to null ("All children") or to a specific child ID
  useEffect(() => {
    if (!initialLoadDone) return

    const cid = selectedChildId ?? undefined
    const refetch = async () => {
      try {
        const [quranRes, recordsRes, summaryRes, alertsRes] = await Promise.all([
          quranApi.getSessions(cid),
          dashboardApi.getRecords(cid),
          dashboardApi.getSummary(cid),
          alertsApi.getAlerts(cid),
        ])
        setQuranSessions(quranRes.data.sessions)
        setQuranChartData(quranRes.data.chartData ?? [])
        setRecords(recordsRes.data)
        setMetrics(summaryRes.data)
        setAllAlerts(alertsRes.data)
      } catch {
        // Suppress — the initial load error handler covers this
      }
    }

    void refetch()
  }, [selectedChildId, initialLoadDone])

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
      await quranApi.addSession(session)
      // Re-fetch per-child data so chart, sessions, metrics, and records all update
      const cid = selectedChildId ?? undefined
      const [quranRes, recordsRes, summaryRes] = await Promise.all([
        quranApi.getSessions(cid),
        dashboardApi.getRecords(cid),
        dashboardApi.getSummary(cid),
      ])
      setQuranSessions(quranRes.data.sessions)
      setQuranChartData(quranRes.data.chartData ?? [])
      setRecords(recordsRes.data)
      setMetrics(summaryRes.data)
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
    quranChartData,
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
