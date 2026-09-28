import { NextResponse } from 'next/server'
import { logger } from '@/features/lib/logger'
import type { AuthCtx } from './context'

/**
 * Authorization policy for household members whose role is `learner`.
 *
 * Feedback item 11: `household_members.role` has always stored
 * 'owner' | 'member' | 'teacher' | 'learner', but nothing consulted it — a
 * learner who signed in had *identical* privileges to the household owner and
 * could add courses, edit any learner's grades, and archive other students.
 *
 * This is enforced at the single API dispatch point (`app/api/[...slug]/route.ts`)
 * rather than inside each of the ~79 mutating handlers, for one reason: it fails
 * CLOSED. A route added later is denied to learners by default and has to be
 * added to a list below on purpose. A per-handler guard fails open — forget the
 * call and the route is silently public, which is how we arrived at zero checks.
 *
 * Non-learner roles are not affected by anything in this file.
 */

export const LEARNER_ROLE = 'learner'

type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Slug pattern matched segment-by-segment against the API path.
 * `'*'` matches exactly one segment; `'**'` matches zero or more trailing segments.
 */
type SlugPattern = string[]

function matchesPattern(slug: string[], pattern: SlugPattern): boolean {
  for (let i = 0; i < pattern.length; i++) {
    const seg = pattern[i]
    if (seg === '**') return true // matches the rest, including nothing
    if (i >= slug.length) return false
    if (seg !== '*' && seg !== slug[i]) return false
  }
  return slug.length === pattern.length
}

/**
 * The only mutations a learner may perform: self-reporting their own work.
 * Chosen deliberately to cover feedback item 12 ("let students self-report Quran
 * progress") without opening anything administrative.
 */
const LEARNER_WRITE_ALLOWLIST: { pattern: SlugPattern; methods: Method[] }[] = [
  { pattern: ['quran', 'sessions', '**'], methods: ['POST', 'PATCH', 'DELETE'] },
  { pattern: ['learning-time', 'sessions', '**'], methods: ['POST', 'PATCH'] },
  { pattern: ['todos', '**'], methods: ['POST', 'PATCH', 'DELETE'] },
  // Marking their own lesson done — but NOT creating, editing or deleting lessons.
  { pattern: ['plan', 'lessons', '*', 'complete'], methods: ['PATCH'] },
]

/**
 * Reads a learner may perform. Deliberately narrow:
 *
 *  - the first three entries are what the app shell bootstraps
 *    (HouseholdProvider fetches household/profile + children + subjects); without
 *    them a learner session cannot render at all;
 *  - the rest are the learner's own working surfaces.
 *
 * Everything omitted is denied — most importantly `gradebook`, `records`,
 * `attendance`, `portfolio` and `compliance`, which return household-wide data
 * covering every learner and are the actual item 11 data exposure.
 */
const LEARNER_READ_ALLOWLIST: SlugPattern[] = [
  ['household', 'profile'],
  ['children', 'children'],
  ['subjects', '**'],
  ['setup-status', '**'],
  ['quran', '**'],
  ['learning-time', '**'],
  ['todos', '**'],
  ['plan', '**'],
  ['badges', '**'],
]

/** Query/body keys that name a learner, used to block cross-learner access. */
const LEARNER_ID_KEYS = ['learnerId', 'childId'] as const

export function isLearnerWriteAllowed(slug: string[], method: string): boolean {
  return LEARNER_WRITE_ALLOWLIST.some(
    entry => entry.methods.includes(method as Method) && matchesPattern(slug, entry.pattern),
  )
}

export function isLearnerReadAllowed(slug: string[]): boolean {
  return LEARNER_READ_ALLOWLIST.some(pattern => matchesPattern(slug, pattern))
}

function forbidden(message: string): Response {
  return NextResponse.json(
    { status: 'error', data: null, message, timestamp: new Date().toISOString() },
    { status: 403 },
  )
}

/** Collects any learner/child ids named by the request's query string or JSON body. */
async function referencedLearnerIds(request: Request): Promise<string[]> {
  const ids: string[] = []

  try {
    const url = new URL(request.url)
    for (const key of LEARNER_ID_KEYS) {
      const value = url.searchParams.get(key)
      if (value) ids.push(value)
    }
  } catch {
    // Unparseable URL — nothing to collect.
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      // clone() so the original body stays unread for the route handler.
      const body = await request.clone().json()
      if (body && typeof body === 'object') {
        for (const key of LEARNER_ID_KEYS) {
          const value = (body as Record<string, unknown>)[key]
          if (typeof value === 'string' && value) ids.push(value)
        }
        // Multi-learner course assignment.
        const learnerIds = (body as Record<string, unknown>).learnerIds
        if (Array.isArray(learnerIds)) {
          for (const value of learnerIds) if (typeof value === 'string' && value) ids.push(value)
        }
      }
    } catch {
      // Empty or non-JSON body — nothing to collect.
    }
  }

  return ids
}

/**
 * Returns a 403 `Response` to short-circuit the request, or `null` to let it
 * through. No-op for every role except `learner`.
 */
export async function enforceLearnerPolicy(
  ctx: AuthCtx,
  slug: string[],
  request: Request,
): Promise<Response | null> {
  if (ctx.role !== LEARNER_ROLE) return null

  const { getLearnerByUserId } = await import('@/features/children/server/repository')
  const own = await getLearnerByUserId(ctx.householdId, ctx.userId)
  if (!own) {
    // A learner-role member with no learner profile cannot be scoped to
    // anything, so deny rather than guess.
    logger.warn(
      { userId: ctx.userId, householdId: ctx.householdId },
      'learnerPolicy: learner-role member has no linked learner profile — denying',
    )
    return forbidden('This account is not linked to a learner profile.')
  }

  // Never let a learner name someone else, on any verb.
  const referenced = await referencedLearnerIds(request)
  const foreign = referenced.find(id => id !== own.id)
  if (foreign) {
    logger.warn(
      { userId: ctx.userId, householdId: ctx.householdId, ownLearnerId: own.id, foreign, slug: slug.join('/') },
      'learnerPolicy: learner referenced another learner — denying',
    )
    return forbidden('Learners can only access their own information.')
  }

  const isRead = request.method === 'GET' || request.method === 'HEAD'
  const allowed = isRead ? isLearnerReadAllowed(slug) : isLearnerWriteAllowed(slug, request.method)
  if (!allowed) {
    logger.warn(
      { userId: ctx.userId, householdId: ctx.householdId, method: request.method, slug: slug.join('/') },
      'learnerPolicy: route not permitted for learner role — denying',
    )
    return forbidden(
      isRead
        ? 'Learners do not have access to this information.'
        : 'Learners are not allowed to make this change.',
    )
  }

  return null
}
