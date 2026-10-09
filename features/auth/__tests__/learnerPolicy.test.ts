/** @jest-environment node */

jest.mock('@/features/children/server/repository', () => ({
  getLearnerByUserId: jest.fn(),
}))

import {
  LEARNER_ROLE,
  isLearnerReadAllowed,
  isLearnerWriteAllowed,
  enforceLearnerPolicy,
} from '@/features/auth/server/learnerPolicy'
import { getLearnerByUserId } from '@/features/children/server/repository'
import type { AuthCtx } from '@/features/auth/server/context'

const mockGetLearnerByUserId = jest.mocked(getLearnerByUserId)

const OWN_LEARNER_ID = 'learner_self'
const SIBLING_LEARNER_ID = 'learner_sibling'

function learnerCtx(overrides: Partial<AuthCtx> = {}): AuthCtx {
  return {
    userId: 'user_learner',
    householdId: 'hh_a',
    email: 'learner.x@no-email.local',
    role: LEARNER_ROLE,
    ...overrides,
  }
}

function req(url: string, method = 'GET', body?: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetLearnerByUserId.mockResolvedValue({ id: OWN_LEARNER_ID } as never)
})

describe('isLearnerWriteAllowed — deny-by-default', () => {
  it('allows the self-report writes a learner is meant to have', () => {
    expect(isLearnerWriteAllowed(['quran', 'sessions'], 'POST')).toBe(true)
    expect(isLearnerWriteAllowed(['quran', 'sessions', 'qs_1'], 'PATCH')).toBe(true)
    expect(isLearnerWriteAllowed(['learning-time', 'sessions'], 'POST')).toBe(true)
    expect(isLearnerWriteAllowed(['todos'], 'POST')).toBe(true)
    expect(isLearnerWriteAllowed(['todos', 'todo_1'], 'PATCH')).toBe(true)
    expect(isLearnerWriteAllowed(['plan', 'lessons', 'lesson_1', 'complete'], 'PATCH')).toBe(true)
  })

  it('denies every other mutation — this is the item 11 exposure', () => {
    // Adding courses
    expect(isLearnerWriteAllowed(['subjects'], 'POST')).toBe(false)
    // Editing anyone's grades
    expect(isLearnerWriteAllowed(['gradebook', 'scores'], 'POST')).toBe(false)
    expect(isLearnerWriteAllowed(['gradebook', 'scores', 'score_1'], 'PUT')).toBe(false)
    // Archiving other students
    expect(isLearnerWriteAllowed(['children', 'children', 'learner_x'], 'PUT')).toBe(false)
    expect(isLearnerWriteAllowed(['children', 'children', 'learner_x', 'archive'], 'PATCH')).toBe(false)
    // Household administration
    expect(isLearnerWriteAllowed(['household', 'profile'], 'PUT')).toBe(false)
    expect(isLearnerWriteAllowed(['household', 'invite'], 'POST')).toBe(false)
    expect(isLearnerWriteAllowed(['household', 'member'], 'DELETE')).toBe(false)
    // School year / records / badges administration
    expect(isLearnerWriteAllowed(['school-years'], 'POST')).toBe(false)
    expect(isLearnerWriteAllowed(['badges', 'definitions'], 'POST')).toBe(false)
    expect(isLearnerWriteAllowed(['compliance', 'requirements'], 'POST')).toBe(false)
  })

  it('does not let a broader lesson write ride in on the lesson-complete allowance', () => {
    expect(isLearnerWriteAllowed(['plan', 'lessons', 'lesson_1'], 'PUT')).toBe(false)
    expect(isLearnerWriteAllowed(['plan', 'lessons', 'lesson_1'], 'DELETE')).toBe(false)
    expect(isLearnerWriteAllowed(['plan', 'lessons'], 'POST')).toBe(false)
  })

  it('denies the bulk lesson shift (preview and apply) — rescheduling is an owner action', async () => {
    expect(isLearnerWriteAllowed(['plan', 'lessons', 'shift', 'preview'], 'POST')).toBe(false)
    expect(isLearnerWriteAllowed(['plan', 'lessons', 'shift', 'apply'], 'POST')).toBe(false)
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['plan', 'lessons', 'shift', 'apply'],
      req('/api/plan/lessons/shift/apply', 'POST', { moves: [] }),
    )
    expect(outcome.response!.status).toBe(403)
  })

  it('does not allow DELETE on learning-time (only create/update a session)', () => {
    expect(isLearnerWriteAllowed(['learning-time', 'sessions', 'lt_1'], 'DELETE')).toBe(false)
  })
})

describe('isLearnerReadAllowed — deny-by-default', () => {
  it('allows the app shell bootstrap and the learner\'s own working surfaces', () => {
    expect(isLearnerReadAllowed(['household', 'profile'])).toBe(true)
    expect(isLearnerReadAllowed(['children', 'children'])).toBe(true)
    expect(isLearnerReadAllowed(['subjects'])).toBe(true)
    expect(isLearnerReadAllowed(['setup-status'])).toBe(true)
    expect(isLearnerReadAllowed(['quran', 'summary'])).toBe(true)
    expect(isLearnerReadAllowed(['learning-time', 'sessions', 'active'])).toBe(true)
    expect(isLearnerReadAllowed(['todos'])).toBe(true)
    expect(isLearnerReadAllowed(['plan', 'lessons'])).toBe(true)
    expect(isLearnerReadAllowed(['badges', 'collection'])).toBe(true)
  })

  it('denies the sensitive household-wide reads (siblings\' grades, records, attendance)', () => {
    expect(isLearnerReadAllowed(['gradebook', 'summaries'])).toBe(false)
    expect(isLearnerReadAllowed(['gradebook', 'scores'])).toBe(false)
    expect(isLearnerReadAllowed(['records', 'report'])).toBe(false)
    expect(isLearnerReadAllowed(['attendance'])).toBe(false)
    expect(isLearnerReadAllowed(['portfolio', 'evidence'])).toBe(false)
    expect(isLearnerReadAllowed(['compliance', 'requirements'])).toBe(false)
    expect(isLearnerReadAllowed(['household', 'members'])).toBe(false)
    expect(isLearnerReadAllowed(['household', 'invitations'])).toBe(false)
    expect(isLearnerReadAllowed(['admin-metrics', 'summary'])).toBe(false)
    expect(isLearnerReadAllowed(['messaging', 'conversations'])).toBe(false)
    expect(isLearnerReadAllowed(['settings'])).toBe(false)
  })
})

describe('enforceLearnerPolicy', () => {
  it('leaves non-learner roles completely untouched', async () => {
    for (const role of ['owner', 'member', 'teacher', undefined]) {
      const outcome = await enforceLearnerPolicy(
        learnerCtx({ role }),
        ['gradebook', 'summaries'],
        req('/api/gradebook/summaries'),
      )
      expect(outcome.allowed).toBe(true)
    }
    expect(mockGetLearnerByUserId).not.toHaveBeenCalled()
  })

  it('403s a learner reading household-wide gradebook summaries', async () => {
    const outcome = await enforceLearnerPolicy(learnerCtx(), ['gradebook', 'summaries'], req('/api/gradebook/summaries'))
    expect(outcome.allowed).toBe(false)
    expect(outcome.response!.status).toBe(403)
  })

  it('403s a learner trying to add a course', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['subjects'],
      req('/api/subjects', 'POST', { name: 'Math', category: 'Math', childId: OWN_LEARNER_ID }),
    )
    expect(outcome.response!.status).toBe(403)
  })

  it('allows a learner to log their own Qur\'an session', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['quran', 'sessions'],
      req('/api/quran/sessions', 'POST', { learnerId: OWN_LEARNER_ID, sessionType: 'memorization' }),
    )
    expect(outcome.allowed).toBe(true)
  })

  it('403s a learner logging a Qur\'an session against a sibling (body learnerId)', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['quran', 'sessions'],
      req('/api/quran/sessions', 'POST', { learnerId: SIBLING_LEARNER_ID, sessionType: 'memorization' }),
    )
    expect(outcome.allowed).toBe(false)
    expect(outcome.response!.status).toBe(403)
  })

  it('403s a learner reading a sibling\'s badge collection (query learnerId)', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['badges', 'collection'],
      req(`/api/badges/collection?learnerId=${SIBLING_LEARNER_ID}`),
    )
    expect(outcome.response!.status).toBe(403)
  })

  it('allows a learner reading their own badge collection', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['badges', 'collection'],
      req(`/api/badges/collection?learnerId=${OWN_LEARNER_ID}`),
    )
    expect(outcome.allowed).toBe(true)
  })

  it('403s a learner using childId to reach a sibling', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['subjects'],
      req(`/api/subjects?childId=${SIBLING_LEARNER_ID}`),
    )
    expect(outcome.response!.status).toBe(403)
  })

  it('fails closed when the learner user has no linked learner row', async () => {
    mockGetLearnerByUserId.mockResolvedValue(null)
    const outcome = await enforceLearnerPolicy(learnerCtx(), ['todos'], req('/api/todos'))
    expect(outcome.allowed).toBe(false)
    expect(outcome.response!.status).toBe(403)
  })

  it('does not consume the request body (downstream handlers can still read it)', async () => {
    const request = req('/api/quran/sessions', 'POST', { learnerId: OWN_LEARNER_ID })
    await enforceLearnerPolicy(learnerCtx(), ['quran', 'sessions'], request)
    await expect(request.json()).resolves.toEqual({ learnerId: OWN_LEARNER_ID })
  })
})

/**
 * Both of these routes already support learner filtering (plan/lessons reads
 * `childIds`, subjects reads `childId`), so rather than let a learner read the
 * whole household's lessons and courses, the gate pins the filter to their own id.
 * Injecting it — rather than requiring the caller to send it — keeps the existing
 * pages working while scoping what they return.
 */
describe('enforceLearnerPolicy — forced self-scoping on household-wide reads', () => {
  it('injects the learner\'s own id into plan/lessons when no filter was supplied', async () => {
    const outcome = await enforceLearnerPolicy(learnerCtx(), ['plan', 'lessons'], req('/api/plan/lessons'))
    expect(outcome.allowed).toBe(true)
    const url = new URL(outcome.request!.url)
    expect(url.searchParams.get('childIds')).toBe(OWN_LEARNER_ID)
  })

  it('injects the learner\'s own id into subjects when no filter was supplied', async () => {
    const outcome = await enforceLearnerPolicy(learnerCtx(), ['subjects'], req('/api/subjects'))
    expect(outcome.allowed).toBe(true)
    const url = new URL(outcome.request!.url)
    expect(url.searchParams.get('childId')).toBe(OWN_LEARNER_ID)
  })

  it('preserves other query parameters while injecting the scope', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['plan', 'lessons'],
      req('/api/plan/lessons?week=2026-09-28'),
    )
    const url = new URL(outcome.request!.url)
    expect(url.searchParams.get('week')).toBe('2026-09-28')
    expect(url.searchParams.get('childIds')).toBe(OWN_LEARNER_ID)
  })

  it('leaves a self-scoped filter the learner already supplied untouched', async () => {
    const outcome = await enforceLearnerPolicy(
      learnerCtx(),
      ['subjects'],
      req(`/api/subjects?childId=${OWN_LEARNER_ID}`),
    )
    const url = new URL(outcome.request!.url)
    expect(url.searchParams.get('childId')).toBe(OWN_LEARNER_ID)
  })

  it('does not rewrite requests for non-learner roles', async () => {
    const outcome = await enforceLearnerPolicy(learnerCtx({ role: 'owner' }), ['plan', 'lessons'], req('/api/plan/lessons'))
    expect(outcome.allowed).toBe(true)
    expect(new URL(outcome.request!.url).searchParams.get('childIds')).toBeNull()
  })

  it('does not inject anything into routes that are not scopable', async () => {
    const outcome = await enforceLearnerPolicy(learnerCtx(), ['todos'], req('/api/todos'))
    expect(outcome.allowed).toBe(true)
    expect(new URL(outcome.request!.url).searchParams.get('childId')).toBeNull()
  })
})
