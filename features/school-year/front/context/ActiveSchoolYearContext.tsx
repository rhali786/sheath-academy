'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { SchoolYear } from '@/features/school-year/types'
import { schoolYearApi } from '@/features/school-year/front/services/api'

export interface ActiveSchoolYearContextType {
  activeSchoolYear: SchoolYear | null
  loading: boolean
}

const ActiveSchoolYearContext = createContext<ActiveSchoolYearContextType | undefined>(undefined)

/**
 * Fetches the active school year once and shares it, so sibling dashboard
 * cards (school year progress, learner command center, compliance status)
 * don't each independently hit /api/school-years/active on the same page load.
 */
export function ActiveSchoolYearProvider({ children }: { children: ReactNode }) {
  const [activeSchoolYear, setActiveSchoolYear] = useState<SchoolYear | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    schoolYearApi.getActiveSchoolYear()
      .then((res) => {
        if (!active) return
        setActiveSchoolYear(res.data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setActiveSchoolYear(null)
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <ActiveSchoolYearContext.Provider value={{ activeSchoolYear, loading }}>
      {children}
    </ActiveSchoolYearContext.Provider>
  )
}

export function useActiveSchoolYear(): ActiveSchoolYearContextType {
  const context = useContext(ActiveSchoolYearContext)
  if (!context) {
    throw new Error('useActiveSchoolYear must be used within ActiveSchoolYearProvider')
  }
  return context
}
