import type { Metadata } from 'next'
import ResetPassword from '@/features/auth/front/pages/ResetPassword'

export const metadata: Metadata = { title: 'Set new password — Sheath Academy' }

export default function Page() {
  return <ResetPassword />
}
