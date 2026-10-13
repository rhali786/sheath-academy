/**
 * The exact 403 bodies the learner policy returns for the school-year requests a
 * learner makes on Settings → School year (UAT step 5.2).
 *
 * `learnerDenials.contract.test.ts` pins these to the real `enforceLearnerPolicy`
 * output, so the jsdom tests that replay them through `fetch` cannot drift from
 * what the server actually sends.
 */
export const LEARNER_READ_DENIED = {
  status: 403,
  body: {
    status: 'error',
    data: null,
    message: 'Learners do not have access to this information.',
  },
} as const

export const LEARNER_WRITE_DENIED = {
  status: 403,
  body: {
    status: 'error',
    data: null,
    message: 'Learners are not allowed to make this change.',
  },
} as const

/** Minimal stand-in for a fetch Response — jsdom has no `Response` global. */
export function fakeResponse(denial: { status: number; body: Record<string, unknown> }) {
  return {
    ok: false,
    status: denial.status,
    json: async () => ({ ...denial.body, timestamp: '2026-10-08T00:23:08.000Z' }),
  } as unknown as Response
}
