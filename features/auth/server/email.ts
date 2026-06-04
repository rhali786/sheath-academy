const FROM = process.env.AUTH_EMAIL_FROM ?? 'Sheath Academy <no-reply@sheathacademy.com>'
const BASE_URL = process.env.AUTH_URL ?? process.env.APP_BASE_URL ?? 'http://localhost:3000'

async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.')
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, ...params }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error('Resend error: ' + (body.message ?? res.status))
  }
}

export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
  const resetUrl = `${BASE_URL}/reset-password?token=${encodeURIComponent(rawToken)}`
  await sendEmail({
    to,
    subject: 'Reset your Sheath Academy password',
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
    text: `You requested a password reset.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
  })
}

export async function sendInvitationEmail(params: {
  to: string
  rawToken: string
  householdName: string
  inviterName?: string
}): Promise<void> {
  const acceptUrl = `${BASE_URL}/invite/accept?token=${encodeURIComponent(params.rawToken)}`
  // Only name the inviter when we actually have one — avoids "by undefined".
  const byClause = params.inviterName ? ` by ${params.inviterName}` : ''
  await sendEmail({
    to: params.to,
    subject: `You've been invited to join ${params.householdName} on Sheath Academy`,
    html: `<p>You've been invited${byClause} to join <strong>${params.householdName}</strong> on Sheath Academy.</p><p><a href="${acceptUrl}">Accept invitation</a></p><p>This link expires in 7 days. If you did not expect this, you can ignore this email.</p>`,
    text: `You've been invited${byClause} to join ${params.householdName} on Sheath Academy.\n\nAccept invitation: ${acceptUrl}\n\nThis link expires in 7 days. If you did not expect this, you can ignore this email.`,
  })
}
