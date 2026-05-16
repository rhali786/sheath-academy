'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { LessonTask } from '../../types'
import { plannerApi } from '../services/api'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { getWeekStartDate } from '../utils/weekDate'

export { getWeekStartDate }

interface PlannerContextType {
  lessons: LessonTask[]
  selectedWeek: Date
  setSelectedWeek: (date: Date) => void
  selectedChildIds: string[]
  setSelectedChildIds: (ids: string[]) => void
  selectedSubjectIds: string[]
  setSelectedSubjectIds: (ids: string[]) => void
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
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekStartDay, setWeekStartDay] = useState<'Monday' | 'Sunday'>('Monday')
  const [childrenList, setChildrenList] = useState<StudentProfile[]>([])
  const [subjectsList, setSubjectsList] = useState<SubjectCourse[]>([])
  const [allChildrenIds, setAllChildrenIds] = useState<string[]>([])
  const [allSubjectIds, setAllSubjectIds] = useState<string[]>([])
  const [lessonsFetchKey, setLessonsFetchKey] = useState(0)

  // Initial load: fetch household profile, children, and subjects
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const profileResponse = await get<unknown>('/api/household/profile')
        const profile = profileResponse.data as any
        const dayStart = profile?.weekStartDay === 'Sunday' ? 'Sunday' : 'Monday'
        setWeekStartDay(dayStart)

        const childrenResponse = await get<StudentProfile[]>('/api/children/children')
        setChildrenList(childrenResponse.data)
        const childIds = childrenResponse.data.map(c => c.id)
        setAllChildrenIds(childIds)
        setSelectedChildIds(childIds)

        const subjectsResponse = await get<SubjectCourse[]>('/api/subjects')
        setSubjectsList(subjectsResponse.data)
        const subjectIds = subjectsResponse.data.map(s => s.id)
        setAllSubjectIds(subjectIds)
        setSelectedSubjectIds(subjectIds)

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load planner')
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Fetch lessons when week or filters change
  useEffect(() => {
    if (selectedChildIds.length === 0 || selectedSubjectIds.length === 0) {
      setLessons([])
      return
    }

    const fetchLessons = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const weekStart = getWeekStartDate(selectedWeek, weekStartDay)
        const lessonsList = await plannerApi.getLessons(
          weekStart,
          selectedChildIds,
          selectedSubjectIds
        )
        setLessons(lessonsList)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lessons')
        setIsLoading(false)
      }
    }

    fetchLessons()
  }, [selectedWeek, selectedChildIds, selectedSubjectIds, weekStartDay, lessonsFetchKey])

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
    isLoading,
    error,
    weekStartDay,
    children: childrenList,
    subjects: subjectsList,
    refreshLessons,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}
