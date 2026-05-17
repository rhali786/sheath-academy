import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import type { Alert } from '@/features/alerts/types'

interface AlertItemProps {
  alert: Alert
}

const severityStyles = {
  high:   { border: 'border-l-red-400',   icon: 'text-red-500' },
  medium: { border: 'border-l-amber-400', icon: 'text-amber-500' },
  low:    { border: 'border-l-slate-300', icon: 'text-slate-400' },
}

export function AlertItem({ alert }: AlertItemProps) {
  const style = severityStyles[alert.severity] ?? severityStyles.low
  const childLabel = alert.childName ?? (alert.childId ? 'Unknown' : null)

  const card = (
    <div className={`rounded-xl border-l-4 ${style.border} bg-white shadow-sm p-4${alert.href ? ' hover:shadow-md transition-shadow' : ''}`} data-testid="alert-item">
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.icon}`} />
        <div className="flex-grow min-w-0">
          {childLabel && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              {childLabel}
            </p>
          )}
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">{alert.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
        </div>
      </div>
    </div>
  )

  if (alert.href) {
    return <Link href={alert.href} className="block">{card}</Link>
  }
  return card
}
