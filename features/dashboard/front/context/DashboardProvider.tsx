'use client'

import React, { createContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { Alert, QuranSession, DashboardRecord, DashboardMetrics, NivoLineSeries } from '@/features/lib/types'
import { dashboardApi } from '@/features/dashboard/front/services/api'
import { alertsApi } from '@/features/alerts/front/services/api'
import { quranApi } from '@/features/quran/front/services/api'
import { useSelectedChild } from '@/features/dashboard/front/hooks/useSelectedChild'
import { useHousehold } from '@/features/household/front/context'
import type { StudentProfile } from '@/features/lib/types'

export interface DashboardContextType {
  children: StudentProfile[]
  alerts: Alert[]
  setAlerts: (alerts: Alert[]) => void
  quranSessions: QuranSession[]
  setQuranSessions: (sessions: QuranSession[]) => void
  quranChartData: NivoLineSeries[]
  records: DashboardRecord[]
  setRecords: (records: DashboardRecord[]) => void
  metrics: DashboardMetrics | null
  setMetrics: (metrics: DashboardMetrics) => void
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
  const { householdProfile, loading: householdLoading, studentProfiles } = useHousehold()
  const [allAlerts, setAllAlerts] = useState<Alert[]>([])
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([])
  const [quranChartData, setQuranChartData] = useState<NivoLineSeries[]>([])
  const [records, setRecords] = useState<DashboardRecord[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedChildId, setSelectedChildId] = useSelectedChild()

  useEffect(() => {
    if (householdLoading) return

    const fetchData = async () => {
      try {
        const [alertsRes, quranRes, recordsRes, summaryRes] = await Promise.all([
          alertsApi.getAlerts(selectedChildId ?? undefined),
          quranApi.getSessions(selectedChildId ?? undefined),
          dashboardApi.getRecords(selectedChildId ?? undefined),
          dashboardApi.getSummary(selectedChildId ?? undefined),
        ])

        setAllAlerts(alertsRes.data)
        setQuranSessions(quranRes.data.sessions)
        setQuranChartData(quranRes.data.chartData ?? [])
        setRecords(recordsRes.data)
        setMetrics(summaryRes.data)
        setLoading(false)
        setInitialLoadDone(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        setLoading(false)
      }
    }

    void fetchData()
    // selectedChildId intentionally excluded — re-fetch handled by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdProfile?.id, householdLoading])

  // Re-fetch per-child data whenever selected child changes (after initial load)
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

  const alerts = useMemo(() => {
    if (!selectedChildId) {
      return allAlerts
    }
    return allAlerts.filter(
      (a) => a.childId === selectedChildId || a.childId === null
    )
  }, [allAlerts, selectedChildId])

  const addQuranSession = async (session: any) => {
    try {
      await quranApi.addSession(session)
      const cid = selectedChildId ?? undefined
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add Quran session')
    }
  }

  const value: DashboardContextType = {
    children: studentProfiles,
    alerts,
    setAlerts: setAllAlerts,
    quranSessions,
    setQuranSessions,
    quranChartData,
    records,
    setRecords,
    metrics,
    setMetrics,
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
