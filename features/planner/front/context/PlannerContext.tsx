'use client'

import React from 'react'
import { LessonTask } from '../../types'

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
  // TODO: Implement provider
  const value: PlannerContextType = {
    lessons: [],
    selectedWeek: new Date(),
    setSelectedWeek: () => {},
    selectedChildIds: [],
    setSelectedChildIds: () => {},
    selectedSubjectIds: [],
    setSelectedSubjectIds: () => {},
    isLoading: false,
    error: null,
  }
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}
