import type { Metadata } from 'next'
import { AboutPage } from '@/features/about/front/pages/About'
import { listChangelogEntries } from '@/features/about/server/repository'
import { withTimeout } from '@/features/lib/server/withTimeout'

export const metadata: Metadata = {
  title: 'About — Sheath Academy',
  description: 'Homeschool management software built for Muslim families.',
}

// This page statically generates at build time. A DB that *errors* is
// handled by the catch below, but a DB that *hangs* (accepts the connection,
// never completes the query) is not — nothing ever rejects, so the build
// stalls indefinitely. Bound the query so the catch always fires.
const CHANGELOG_QUERY_TIMEOUT_MS = 8_000

export default async function Page() {
  let changelogEntries: Awaited<ReturnType<typeof listChangelogEntries>> = []
  try {
    changelogEntries = await withTimeout(
      listChangelogEntries(),
      CHANGELOG_QUERY_TIMEOUT_MS,
      'listChangelogEntries',
    )
  } catch {
    // DB unavailable or too slow — static changelog still renders
  }
  return <AboutPage changelogEntries={changelogEntries} />
}
