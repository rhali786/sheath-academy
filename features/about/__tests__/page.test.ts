/** @jest-environment node */

/**
 * The /about route statically generates at build time. It must never fail a
 * build because the DB is unreachable — including a DB that hangs (accepts
 * the connection, never completes the query) rather than erroring outright.
 * See docs/bug_enhancement/20260928-feedback-wave1-2-plan.md Phase 0.
 */

jest.mock('@/features/about/server/repository', () => ({
  listChangelogEntries: jest.fn(),
}))

import { listChangelogEntries } from '@/features/about/server/repository'
import Page from '../../../app/(shell)/about/page'
import type { ChangelogEntry } from '@/features/about/types'

const mockList = listChangelogEntries as jest.Mock

beforeEach(() => {
  mockList.mockReset()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('About page (server component)', () => {
  it('renders with the fetched changelog entries when the query resolves normally', async () => {
    const entries: ChangelogEntry[] = [
      {
        id: 'cl_1',
        version: '2.8.3',
        label: 'Fix',
        detail: 'Detail',
        source: 'manual',
        prNumber: null,
        userCredit: null,
        status: 'shipped',
        createdAt: '2026-05-25T18:00:00.000Z',
      },
    ]
    mockList.mockResolvedValue(entries)

    const element = await Page()

    expect(element.props.changelogEntries).toEqual(entries)
  })

  it('renders with an empty changelog when the query rejects', async () => {
    mockList.mockRejectedValue(new Error('connection refused'))

    const element = await Page()

    expect(element.props.changelogEntries).toEqual([])
  })

  it('renders with an empty changelog — and does not hang — when the query never settles', async () => {
    jest.useFakeTimers()
    mockList.mockReturnValue(new Promise(() => {}))

    const pending = Page()
    // Advance well past whatever internal timeout guards the query.
    await jest.advanceTimersByTimeAsync(60_000)
    const element = await pending

    expect(element.props.changelogEntries).toEqual([])
  })
})
