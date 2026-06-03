import type { Metadata } from 'next'
import { FeedbackDetailPage } from '@/features/feedback/front/pages/FeedbackDetailPage'

export const metadata: Metadata = {
  title: 'Feedback detail — Sheath Academy',
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FeedbackDetailPage id={id} />
}
