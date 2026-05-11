import type { Metadata } from 'next'
import Login from '@/features/auth/front/pages/Login'

export const metadata: Metadata = { title: 'Sign in — Sheath Academy' }

export default function Page() {
  return <Login />
}
