'use client'

import { useState } from 'react'
import { HouseholdProvider } from '@/features/household/front/context'
import { ShellAuthGuard } from './ShellAuthGuard'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

function ShellLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuOpen={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellAuthGuard>
      <HouseholdProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest-900 focus:text-white focus:rounded-lg focus:text-sm"
        >
          Skip to content
        </a>
        <ShellLayout>{children}</ShellLayout>
      </HouseholdProvider>
    </ShellAuthGuard>
  )
}
