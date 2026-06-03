import type { Metadata } from 'next'
import { AdminFeedbackPage } from '@/features/feedback/front/pages/AdminFeedbackPage'

export const metadata: Metadata = {
  title: 'Feedback operations — Sheath Academy',
}

export default function Page() {
  return <AdminFeedbackPage />
}
