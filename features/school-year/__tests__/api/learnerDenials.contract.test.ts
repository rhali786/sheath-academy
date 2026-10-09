/** @jest-environment node */

/**
 * UAT 5.2 contract: a learner on Settings → School year makes two requests. This
 * pins what the real learner policy answers for each, so the UI tests that replay
 * `LEARNER_READ_DENIED` / `LEARNER_WRITE_DENIED` are testing against real bytes.
 */

jest.mock('@/features/children/server/repository', () => ({
  getLearnerByUserId: jest.fn(),
}))

import { LEARNER_ROLE, enforceLearnerPolicy } from '@/features/auth/server/learnerPolicy'
import { getLearnerByUserId } from '@/features/children/server/repository'
import type { AuthCtx } from '@/features/auth/server/context'
import { LEARNER_READ_DENIED, LEARNER_WRITE_DENIED } from '../fixtures/learnerDenials'

const learner: AuthCtx = {
  userId: 'user_learner',
  householdId: 'hh_a',
  email: 'learner.x@no-email.local',
  role: LEARNER_ROLE,
}

beforeEach(() => {
  jest.mocked(getLearnerByUserId).mockResolvedValue({ id: 'learner_self' } as never)
})

async function denialFor(slug: string[], method: string, body?: unknown) {
  const request = new Request(`http://localhost/api/${slug.join('/')}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const outcome = await enforceLearnerPolicy(learner, slug, request)
  expect(outcome.allowed).toBe(false)
  const res = outcome.response as Response
  const json = await res.json()
  return { status: res.status, body: { status: json.status, data: json.data, message: json.message } }
}

describe('UAT 5.2 — learner policy answers for Settings → School year', () => {
  it('GET /api/school-years/active (loading the tab) is denied with LEARNER_READ_DENIED', async () => {
    expect(await denialFor(['school-years', 'active'], 'GET')).toEqual(LEARNER_READ_DENIED)
  })

  it('POST /api/school-years (Amir creating a year) is denied with LEARNER_WRITE_DENIED', async () => {
    const denial = await denialFor(['school-years'], 'POST', {
      name: '2026–2027', startDate: '2026-08-01', endDate: '2027-05-31', isActive: true,
    })
    expect(denial).toEqual(LEARNER_WRITE_DENIED)
  })

  it('PUT /api/school-years/:id (saving a break) is denied with LEARNER_WRITE_DENIED', async () => {
    const denial = await denialFor(['school-years', 'sy_1'], 'PUT', { breaks: [] })
    expect(denial).toEqual(LEARNER_WRITE_DENIED)
  })
})
