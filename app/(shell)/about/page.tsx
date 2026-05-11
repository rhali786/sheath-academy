import type { Metadata } from 'next'
import { AboutPage } from '@/features/about/front/pages/About'

export const metadata: Metadata = {
  title: 'About — Sheath Academy',
  description: 'Homeschool management software built for Muslim families.',
}

export default function Page() {
  return <AboutPage />
}
