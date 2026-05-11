import type { Metadata } from 'next'
import { AboutPage } from '@/features/about/front/pages/About'
import { HouseholdProvider } from '@/features/household/front/context'

export const metadata: Metadata = {
  title: 'About — Sheath Academy',
  description: 'Homeschool management software built for Muslim families.',
}

export default function Page() {
  return (
    <HouseholdProvider>
      <AboutPage />
    </HouseholdProvider>
  )
}
