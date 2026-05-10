import { AlertTriangle } from 'lucide-react'
import type { Alert } from '../../types'

interface AlertItemProps {
  alert: Alert
}

const priorityStyles = {
  amber: { border: 'border-l-amber-400', icon: 'text-amber-500' },
  red:   { border: 'border-l-red-400',   icon: 'text-red-500' },
  gray:  { border: 'border-l-slate-300', icon: 'text-slate-400' },
}

const childNames: Record<string, string> = {
  adam_001:     'Adam',
  khadijah_001: 'Khadijah',
  zayd_001:     'Zayd',
}

export function AlertItem({ alert }: AlertItemProps) {
  const style = priorityStyles[alert.priority as keyof typeof priorityStyles] || priorityStyles.gray

  return (
    <div className={`rounded-xl border-l-4 ${style.border} bg-white shadow-sm p-4`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.icon}`} />
        <div className="flex-grow min-w-0">
          {alert.childId && alert.childId !== 'family' && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              {childNames[alert.childId] || alert.childId}
            </p>
          )}
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">{alert.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.detail}</p>
        </div>
        <button className="text-xs font-semibold text-sky-600 hover:text-sky-700 whitespace-nowrap flex-shrink-0 mt-0.5">
          {alert.actionButton}
        </button>
      </div>
    </div>
  )
}
