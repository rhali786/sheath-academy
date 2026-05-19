import type { VerificationStatus } from '@/features/resources/types'

const BADGE_STYLES: Record<VerificationStatus, string> = {
  'verified':       'bg-green-100 text-green-800',
  'needs-review':   'bg-amber-100 text-amber-800',
  'user-submitted': 'bg-slate-100 text-slate-600',
  'deprecated':     'bg-red-100 text-red-700',
}

const BADGE_LABELS: Record<VerificationStatus, string> = {
  'verified':       'Verified',
  'needs-review':   'Needs review',
  'user-submitted': 'User submitted',
  'deprecated':     'Deprecated',
}

interface VerificationBadgeProps {
  status: VerificationStatus
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${BADGE_STYLES[status]}`}
      data-testid={`verification-badge-${status}`}
    >
      {BADGE_LABELS[status]}
    </span>
  )
}
