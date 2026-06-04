/** @jest-environment node */

import { sendInvitationEmail } from '@/features/auth/server/email'

const originalFetch = global.fetch
const originalKey = process.env.RESEND_API_KEY

let lastBody: { from: string; to: string; subject: string; html: string; text: string }

beforeEach(() => {
  process.env.RESEND_API_KEY = 'test_key'
  global.fetch = jest.fn(async (_url: string, init: { body: string }) => {
    lastBody = JSON.parse(init.body)
    return { ok: true, json: async () => ({}) } as Response
  }) as unknown as typeof fetch
})

afterEach(() => {
  global.fetch = originalFetch
  process.env.RESEND_API_KEY = originalKey
})

describe('sendInvitationEmail wording', () => {
  it('subject leads with "You\'ve been invited" and uses the household NAME (not id)', async () => {
    await sendInvitationEmail({
      to: 'invitee@test.com',
      rawToken: 'tok123',
      householdName: 'Barakah Academy',
      inviterName: 'Rasheed',
    })
    expect(lastBody.subject).toMatch(/You've been invited/i)
    expect(lastBody.subject).toContain('Barakah Academy')
    expect(lastBody.subject).not.toMatch(/household_/) // never leak the raw id
  })

  it('body names the inviter and household, and includes the accept link with the raw token', async () => {
    await sendInvitationEmail({
      to: 'invitee@test.com',
      rawToken: 'tok123',
      householdName: 'Barakah Academy',
      inviterName: 'Rasheed',
    })
    for (const content of [lastBody.html, lastBody.text]) {
      expect(content).toMatch(/You've been invited/i)
      expect(content).toContain('Barakah Academy')
      expect(content).toContain('Rasheed')
      expect(content).toContain('tok123')
    }
  })

  it('falls back gracefully when no inviter name is given (no "by undefined")', async () => {
    await sendInvitationEmail({
      to: 'invitee@test.com',
      rawToken: 'tok123',
      householdName: 'Barakah Academy',
    })
    expect(lastBody.subject).toMatch(/You've been invited/i)
    expect(lastBody.html).not.toMatch(/undefined/)
    expect(lastBody.text).not.toMatch(/undefined/)
  })
})
