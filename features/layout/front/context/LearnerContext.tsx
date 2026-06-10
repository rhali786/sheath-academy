'use client'

import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'sheath.selectedChildId'

function readStorageSync(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw || null
  } catch {
    return null
  }
}

export interface LearnerContextType {
  selectedChildId: string | null
  setSelectedChildId: (id: string | null) => void
}

const LearnerContext = createContext<LearnerContextType | undefined>(undefined)

export function useLearner(): LearnerContextType {
  const context = useContext(LearnerContext)
  if (!context) {
    throw new Error('useLearner must be used within LearnerProvider')
  }
  return context
}

export function LearnerProvider({ children }: { children: ReactNode }) {
  const [selectedChildId, setState] = useState<string | null>(readStorageSync)

  const setSelectedChildId = useCallback((id: string | null) => {
    setState(id || null)
    if (typeof window === 'undefined') return
    try {
      if (id === null || id === '') {
        sessionStorage.removeItem(STORAGE_KEY)
      } else {
        sessionStorage.setItem(STORAGE_KEY, id)
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [])

  return (
    <LearnerContext.Provider value={{ selectedChildId, setSelectedChildId }}>
      {children}
    </LearnerContext.Provider>
  )
}
