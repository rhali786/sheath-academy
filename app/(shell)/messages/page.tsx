import type { Metadata } from 'next'
import { MessagingPage } from '@/features/messaging/front/pages/MessagingPage'

export const metadata: Metadata = {
  title: 'Messages',
}

export default function Page() {
  return <MessagingPage />
}
