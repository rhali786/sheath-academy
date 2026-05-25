const FROM = process.env.AUTH_EMAIL_FROM ?? 'Sheath Academy <no-reply@sheathacademy.com>'
const BASE_URL = process.env.AUTH_URL ?? process.env.APP_BASE_URL ?? 'http://localhost:3000'

export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      'RESEND_API_KEY is not configured. Add it to .env.local or the hosting provider environment.',
    )
  }

  const resetUrl = `${BASE_URL}/reset-password?token=${encodeURIComponent(rawToken)}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: 'Reset your Sheath Academy password',
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
      text: `You requested a password reset.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new Error('Resend error: ' + (body.message ?? res.status))
  }
}
