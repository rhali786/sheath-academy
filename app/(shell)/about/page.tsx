import type { Metadata } from 'next'
import { AboutPage } from '@/features/about/front/pages/About'
import { listChangelogEntries } from '@/features/about/server/repository'

export const metadata: Metadata = {
  title: 'About — Sheath Academy',
  description: 'Homeschool management software built for Muslim families.',
}

export default async function Page() {
  let changelogEntries: Awaited<ReturnType<typeof listChangelogEntries>> = []
  try {
    changelogEntries = await listChangelogEntries()
  } catch {
    // DB unavailable — static changelog still renders
  }
  return <AboutPage changelogEntries={changelogEntries} />
}
