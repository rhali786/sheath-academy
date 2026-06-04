import type { Metadata } from 'next'
import LandingPage from '@/features/landing/front/pages/LandingPage'

export const metadata: Metadata = {
  title: 'Sheath Academy — Homeschool Dashboard for Muslim Families',
  description:
    'A homeschool dashboard built from the ground up for Muslim families — Quran, Arabic, and an Islamic school year at its core. Not adapted. Built.',
}

export default function Page() {
  return <LandingPage />
}
