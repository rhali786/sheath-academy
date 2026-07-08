import Link from 'next/link'
import type { Alert, AlertSourceFeature } from '@/features/alerts/types'

interface AlertItemProps {
  alert: Alert
}

const severityStyles = {
  high:   { border: 'border-l-red-400',   icon: 'text-red-500' },
  medium: { border: 'border-l-amber-400', icon: 'text-amber-500' },
  low:    { border: 'border-l-slate-300', icon: 'text-slate-400' },
}

const SOURCE_META: Record<AlertSourceFeature, { label: string; emoji: string }> = {
  planner: { label: 'Planbook', emoji: '📚' },
  attendance: { label: 'Attendance', emoji: '📅' },
  gradebook: { label: 'Gradebook', emoji: '📊' },
  compliance: { label: 'Compliance', emoji: '🛡️' },
  dashboard: { label: 'Schedule', emoji: '⏱️' },
  portfolio: { label: 'Portfolio', emoji: '🗂️' },
  quran: { label: 'Quran', emoji: '📖' },
  records: { label: 'Records', emoji: '🗒️' },
}

function chipColor(name: string): string {
  const colors = ['bg-forest-600', 'bg-sky-600', 'bg-amber-600', 'bg-violet-600', 'bg-rose-600']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % colors.length
  return colors[hash]
}

export function AlertItem({ alert }: AlertItemProps) {
  const style = severityStyles[alert.severity] ?? severityStyles.low
  const childLabel = alert.childName ?? (alert.childId ? 'Unknown' : null)
  const source = SOURCE_META[alert.sourceFeature] ?? { label: alert.sourceFeature, emoji: '🔔' }

  const card = (
    <div className={`rounded-xl border-l-4 ${style.border} bg-white shadow-sm p-4${alert.href ? ' hover:shadow-md transition-shadow' : ''}`} data-testid="alert-item">
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm"
          aria-hidden="true"
        >
          {source.emoji}
        </span>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 leading-snug">{alert.title}</h3>
            {childLabel && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-600 bg-slate-100 rounded-full pl-1 pr-2 py-0.5 shrink-0 whitespace-nowrap">
                <span
                  className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${chipColor(childLabel)}`}
                  aria-hidden="true"
                >
                  {childLabel.slice(0, 1).toUpperCase()}
                </span>
                {childLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1.5">
            from <span className="text-forest-700">{source.label}</span>
          </p>
        </div>
      </div>
    </div>
  )

  if (alert.href) {
    return <Link href={alert.href} className="block">{card}</Link>
  }
  return card
}
