import type { Metadata } from 'next'
import { FeedbackHubPage } from '@/features/feedback/front/pages/FeedbackHubPage'

export const metadata: Metadata = {
  title: 'My feedback — Sheath Academy',
}

export default function Page() {
  return <FeedbackHubPage />
}
