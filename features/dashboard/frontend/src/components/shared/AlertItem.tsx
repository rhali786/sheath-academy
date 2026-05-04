import { AlertCircle } from 'lucide-react'
import type { Alert } from '../../types'

interface AlertItemProps {
  alert: Alert
}

const priorityColors = {
  amber: 'bg-amber-50 border-amber-200',
  red: 'bg-red-50 border-red-200',
  gray: 'bg-gray-50 border-gray-200',
}

const badgeColors = {
  amber: 'badge-amber',
  red: 'badge-red',
  gray: 'badge-gray',
}

export function AlertItem({ alert }: AlertItemProps) {
  const bgColor = priorityColors[alert.priority as keyof typeof priorityColors] || priorityColors.gray
  const badgeColor = badgeColors[alert.priority as keyof typeof badgeColors] || badgeColors.gray

  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            {alert.childId && alert.childId !== 'family' && (
              <span className={`badge text-xs ${badgeColor}`}>
                {alert.childId === 'adam_001' ? 'Adam' : alert.childId === 'khadijah_001' ? 'Khadijah' : 'Zayd'}
              </span>
            )}
            {!alert.childId && (
              <span className="badge badge-gray text-xs">—</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{alert.detail}</p>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap">
          {alert.actionButton}
        </button>
      </div>
    </div>
  )
}
