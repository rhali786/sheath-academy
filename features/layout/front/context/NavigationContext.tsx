'use client'

import { createContext, useContext, useState } from 'react'

interface NavigationContextType {
  selectedTab: string
  setSelectedTab: (tab: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function useNavigation(): NavigationContextType {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within AppShell')
  return ctx
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [selectedTab, setSelectedTab] = useState('Today')
  return (
    <NavigationContext.Provider value={{ selectedTab, setSelectedTab }}>
      {children}
    </NavigationContext.Provider>
  )
}
