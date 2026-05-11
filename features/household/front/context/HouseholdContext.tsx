'use client'

import React, { createContext, useState, useEffect, ReactNode } from 'react'
import type { Workspace, HouseholdProfile } from '@/features/lib/types'
import { householdApi } from '../services/api'

export interface HouseholdContextType {
  workspace: Workspace | null
  householdProfile: HouseholdProfile | null
  familyName: string
  loading: boolean
  error: string | null
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
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [householdProfile, setHouseholdProfile] = useState<HouseholdProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([householdApi.getWorkspace(), householdApi.getProfile()])
      .then(([wsRes, profileRes]) => {
        setWorkspace(wsRes.data)
        setHouseholdProfile(profileRes.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load household')
        setLoading(false)
      })
  }, [])

  const familyName = householdProfile?.familyName ?? workspace?.name ?? ''

  const value: HouseholdContextType = {
    workspace,
    householdProfile,
    familyName,
    loading,
    error,
  }

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}
