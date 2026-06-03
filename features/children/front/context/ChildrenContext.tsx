'use client'

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { StudentProfile } from '@/features/lib/types'
import { childrenApi } from '../services/api'
import { useHousehold } from '@/features/household/front/context'

export interface ChildrenContextType {
  children: StudentProfile[]
  allChildren: StudentProfile[]
  householdId: string | null
  showArchived: boolean
  setShowArchived: (show: boolean) => void
  loading: boolean
  error: string | null
  refetch: () => void
  createChild: (data: Partial<StudentProfile> & { householdId: string; name: string; gradeLabel: string; username: string; password: string }) => Promise<StudentProfile>
  updateChild: (id: string, data: Partial<StudentProfile>) => Promise<StudentProfile>
  archiveChild: (id: string) => Promise<StudentProfile>
  restoreChild: (id: string) => Promise<StudentProfile>
}

export const ChildrenContext = createContext<ChildrenContextType | undefined>(undefined)

export function useChildren(): ChildrenContextType {
  const context = React.useContext(ChildrenContext)
  if (!context) {
    throw new Error('useChildren must be used within ChildrenProvider')
  }
  return context
}

export interface ChildrenProviderProps {
  children: ReactNode
  householdId: string
}

export function ChildrenProvider({ children, householdId }: ChildrenProviderProps) {
  const { refetch: refetchHousehold } = useHousehold()
  const [allChildren, setAllChildren] = useState<StudentProfile[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await childrenApi.getChildren(householdId, true)
      setAllChildren(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load children')
    } finally {
      setLoading(false)
    }
  }, [householdId])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  const visibleChildren = showArchived
    ? allChildren
    : allChildren.filter(c => c.isActive)

  const value: ChildrenContextType = {
    children: visibleChildren,
    allChildren,
    householdId,
    showArchived,
    setShowArchived,
    loading,
    error,
    refetch: fetchChildren,
    createChild: async (data) => {
      const res = await childrenApi.createChild(data)
      if (res.data) {
        setAllChildren(prev => [...prev, res.data!])
        refetchHousehold()
        return res.data
      }
      throw new Error(res.message || 'Failed to create child')
    },
    updateChild: async (id, data) => {
      const res = await childrenApi.updateChild(id, data)
      if (res.data) {
        setAllChildren(prev => prev.map(c => c.id === id ? res.data! : c))
        refetchHousehold()
        return res.data
      }
      throw new Error(res.message || 'Failed to update child')
    },
    archiveChild: async (id) => {
      const res = await childrenApi.archiveChild(id)
      if (res.data) {
        setAllChildren(prev => prev.map(c => c.id === id ? res.data! : c))
        refetchHousehold()
        return res.data
      }
      throw new Error(res.message || 'Failed to archive child')
    },
    restoreChild: async (id) => {
      const res = await childrenApi.restoreChild(id)
      if (res.data) {
        setAllChildren(prev => prev.map(c => c.id === id ? res.data! : c))
        refetchHousehold()
        return res.data
      }
      throw new Error(res.message || 'Failed to restore child')
    },
  }

  return (
    <ChildrenContext.Provider value={value}>
      {children}
    </ChildrenContext.Provider>
  )
}
