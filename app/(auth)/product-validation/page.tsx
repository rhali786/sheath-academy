import type { Metadata } from 'next'
import { FeedbackPage } from '@/features/product-validation/front/pages/FeedbackPage'

export const metadata: Metadata = {
  title: 'Product validation — Sheath Academy',
  description: 'Share structured feedback about your experience with Sheath Academy.',
}

export default function Page() {
  return <FeedbackPage />
}
