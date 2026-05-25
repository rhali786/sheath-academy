import type { Metadata } from 'next'
import Signup from '@/features/auth/front/pages/Signup'

export const metadata: Metadata = { title: 'Create account — Sheath Academy' }

export default function Page() {
  return <Signup />
}
