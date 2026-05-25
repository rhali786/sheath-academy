export type FeedbackSentiment = 'bad' | 'poor' | 'okay' | 'good' | 'great'

export interface FeedbackSubmitInput {
  pagePath: string
  sentiment: FeedbackSentiment
  message?: string
}

export interface FeedbackRow {
  id: string
  userId: string | null
  householdId: string | null
  userEmail: string
  pagePath: string
  sentiment: FeedbackSentiment
  message: string | null
  createdAt: string
}
