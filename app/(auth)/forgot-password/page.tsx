import type { Metadata } from 'next'
import ForgotPassword from '@/features/auth/front/pages/ForgotPassword'

export const metadata: Metadata = { title: 'Reset password — Sheath Academy' }

export default function Page() {
  return <ForgotPassword />
}
