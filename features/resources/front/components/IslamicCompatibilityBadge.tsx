import type { CompatibilitySignal } from '@/features/resources/types'

const SIGNAL_STYLES: Record<CompatibilitySignal, string> = {
  'generally-compatible': 'bg-green-100 text-green-800',
  'needsContext':         'bg-amber-100 text-amber-800',
  'worldviewConcern':     'bg-orange-100 text-orange-800',
  'sensitivContent':      'bg-red-100 text-red-700',
  'stronglyBeneficial':   'bg-emerald-100 text-emerald-800',
  'notReviewed':          'bg-slate-100 text-slate-500',
}

const SIGNAL_LABELS: Record<CompatibilitySignal, string> = {
  'generally-compatible': 'Generally compatible',
  'needsContext':         'Needs parent context',
  'worldviewConcern':     'Worldview concern',
  'sensitivContent':      'Sensitive content',
  'stronglyBeneficial':   'Strongly beneficial',
  'notReviewed':          'Not reviewed',
}

interface IslamicCompatibilityBadgeProps {
  signal: CompatibilitySignal
}

export function IslamicCompatibilityBadge({ signal }: IslamicCompatibilityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SIGNAL_STYLES[signal]}`}
      data-testid={`islamic-compat-badge-${signal}`}
    >
      {SIGNAL_LABELS[signal]}
    </span>
  )
}
