import { HouseholdProvider } from '@/features/household/front/context'
import { Header } from './Header'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest-900 focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        {children}
      </main>
    </HouseholdProvider>
  )
}
