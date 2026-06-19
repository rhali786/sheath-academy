import type { Metadata } from 'next'
import InviteAccept from '@/features/household/front/pages/InviteAccept'

export const metadata: Metadata = { title: 'Accept invitation — Sheath Academy' }

export default function Page() {
  return <InviteAccept />
}
