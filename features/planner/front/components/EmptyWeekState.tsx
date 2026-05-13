'use client'

export interface EmptyWeekStateProps {
  lessons: unknown[]
}

const MESSAGES = [
  "No lessons scheduled for this week — add one to get started!",
  "Take a breath — no lessons this week!",
  "Week looks clear! Time to plan ahead.",
  "No lessons this week. Perfect time to rest!",
  "All caught up! No lessons to show.",
]

export function EmptyWeekState({ lessons }: EmptyWeekStateProps) {
  if (lessons.length > 0) {
    return null
  }

  const randomMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

  return (
    <div className="flex items-center justify-center min-h-64 bg-white rounded-lg border-2 border-dashed border-slate-300">
      <div className="text-center px-6">
        <p className="text-lg font-medium text-slate-700">{randomMessage}</p>
      </div>
    </div>
  )
}
