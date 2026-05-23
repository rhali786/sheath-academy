'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { LessonTask } from '../../types'
import { plannerApi } from '../services/api'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { getWeekStartDate } from '../utils/weekDate'
import { useHousehold } from '@/features/household/front/context'

export { getWeekStartDate }

interface PlannerContextType {
  lessons: LessonTask[]
  selectedWeek: Date
  setSelectedWeek: (date: Date) => void
  selectedChildIds: string[]
  setSelectedChildIds: (ids: string[]) => void
  selectedSubjectIds: string[]
  setSelectedSubjectIds: (ids: string[]) => void
  isInitializing: boolean
  isLessonsLoading: boolean
  isLoading: boolean
  error: string | null
  weekStartDay: 'Monday' | 'Sunday'
  children: StudentProfile[]
  subjects: SubjectCourse[]
  refreshLessons?: () => void
}

export const PlannerContext = React.createContext<PlannerContextType | undefined>(undefined)

export function usePlanner() {
  const context = React.useContext(PlannerContext)
  if (!context) {
    throw new Error('usePlanner must be used within PlannerProvider')
  }
  return context
}

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const port = process.env.PORT || '3000'
  return `http://127.0.0.1:${port}`
}

async function get<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${getApiBaseUrl()}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const { householdProfile, loading: householdLoading } = useHousehold()
  const weekStartDay: 'Monday' | 'Sunday' =
    householdProfile?.weekStartDay === 'Sunday' ? 'Sunday' : 'Monday'

  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLessonsLoading, setIsLessonsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [childrenList, setChildrenList] = useState<StudentProfile[]>([])
  const [subjectsList, setSubjectsList] = useState<SubjectCourse[]>([])
  const [lessonsFetchKey, setLessonsFetchKey] = useState(0)

  // Init: children + subjects only — profile comes from HouseholdProvider
  useEffect(() => {
    if (householdLoading) return
    let cancelled = false
    ;(async () => {
      setIsInitializing(true)
      setError(null)
      try {
        const [childrenResponse, subjectsResponse] = await Promise.all([
          get<StudentProfile[]>('/api/children/children'),
          get<SubjectCourse[]>('/api/subjects'),
        ])
        if (cancelled) return
        setChildrenList(childrenResponse.data)
        setSelectedChildIds(childrenResponse.data.map(c => c.id))
        setSubjectsList(subjectsResponse.data)
        setSelectedSubjectIds(subjectsResponse.data.map(s => s.id))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load planner')
      } finally {
        if (!cancelled) setIsInitializing(false)
      }
    })()
    return () => { cancelled = true }
  }, [householdLoading])

  // Lessons: separate loading flag, fires after init completes
  useEffect(() => {
    if (householdLoading || isInitializing) return
    if (selectedChildIds.length === 0 || selectedSubjectIds.length === 0) {
      setLessons([])
      return
    }
    let cancelled = false
    ;(async () => {
      setIsLessonsLoading(true)
      setError(null)
      try {
        const weekStart = getWeekStartDate(selectedWeek, weekStartDay)
        const lessonsList = await plannerApi.getLessons(
          weekStart,
          selectedChildIds,
          selectedSubjectIds,
        )
        if (!cancelled) setLessons(lessonsList)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load lessons')
      } finally {
        if (!cancelled) setIsLessonsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [householdLoading, isInitializing, selectedWeek, selectedChildIds, selectedSubjectIds, weekStartDay, lessonsFetchKey])

  const refreshLessons = useCallback(() => {
    setLessonsFetchKey(k => k + 1)
  }, [])

  const value: PlannerContextType = {
    lessons,
    selectedWeek,
    setSelectedWeek,
    selectedChildIds,
    setSelectedChildIds,
    selectedSubjectIds,
    setSelectedSubjectIds,
    isInitializing,
    isLessonsLoading,
    isLoading: isInitializing || isLessonsLoading,
    error,
    weekStartDay,
    children: childrenList,
    subjects: subjectsList,
    refreshLessons,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}
