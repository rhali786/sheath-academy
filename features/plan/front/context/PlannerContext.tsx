'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { LessonTask } from '../../types'
import { plannerApi } from '../services/api'
import type { StudentProfile } from '@/features/lib/types'
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

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const { householdProfile, loading: householdLoading, studentProfiles, allSubjects } = useHousehold()
  const weekStartDay: 'Monday' | 'Sunday' =
    householdProfile?.weekStartDay === 'Sunday' ? 'Sunday' : 'Monday'

  const [lessons, setLessons] = useState<LessonTask[]>([])
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [isLessonsLoading, setIsLessonsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonsFetchKey, setLessonsFetchKey] = useState(0)

  // Sync child/subject selection from HouseholdProvider when it finishes loading
  useEffect(() => {
    if (householdLoading) return
    const activeChildren = studentProfiles.filter(p => p.isActive)
    setSelectedChildIds(activeChildren.map(c => c.id))
    setSelectedSubjectIds(allSubjects.map(s => s.id))
  }, [householdLoading, studentProfiles, allSubjects])

  // isInitializing mirrors householdLoading — children+subjects now come from context
  const isInitializing = householdLoading

  // Lessons: fires after household (and therefore children+subjects) have loaded
  useEffect(() => {
    if (householdLoading) {
      return
    }
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
  }, [householdLoading, selectedWeek, selectedChildIds, selectedSubjectIds, weekStartDay, lessonsFetchKey])

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
    children: studentProfiles.filter(p => p.isActive),
    subjects: allSubjects,
    refreshLessons,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}
