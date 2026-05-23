'use client'

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { HouseholdProfile } from '@/features/lib/types'
import { householdApi } from '../services/api'

export interface HouseholdContextType {
  householdProfile: HouseholdProfile | null
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHousehold = useCallback(() => {
    setLoading(true)
    householdApi
      .getProfile()
      .then((profileRes) => {
        setHouseholdProfile(profileRes.data)
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
