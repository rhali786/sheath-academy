'use client'

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { HouseholdProfile, StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { householdApi } from '../services/api'
import { childrenApi } from '@/features/children/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'

export interface HouseholdContextType {
  householdProfile: HouseholdProfile | null
  studentProfiles: StudentProfile[]
  allSubjects: SubjectCourse[]
  familyName: string
  needsSetup: boolean
  loading: boolean
  error: string | null
  refetch: () => void
}

export const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined)

export function useHousehold(): HouseholdContextType {
  const context = React.useContext(HouseholdContext)
  if (!context) {
    throw new Error('useHousehold must be used within HouseholdProvider')
  }
  return context
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [householdProfile, setHouseholdProfile] = useState<HouseholdProfile | null>(null)
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([])
  const [allSubjects, setAllSubjects] = useState<SubjectCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHousehold = useCallback(() => {
    setLoading(true)
    Promise.all([
      householdApi.getProfile(),
      childrenApi.getAllChildren(false),
      subjectsApi.getSubjects(),
    ])
      .then(([profileRes, childrenRes, subjectsRes]) => {
        setHouseholdProfile(profileRes.data)
        setStudentProfiles(childrenRes.data ?? [])
        setAllSubjects(subjectsRes.data ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load household')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchHousehold()
  }, [fetchHousehold])

  const familyName = householdProfile?.familyName ?? ''
  const needsSetup = !loading && !householdProfile

  const value: HouseholdContextType = {
    householdProfile,
    studentProfiles,
    allSubjects,
    familyName,
    needsSetup,
    loading,
    error,
    refetch: fetchHousehold,
  }

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}
