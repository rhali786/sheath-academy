import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AlertItem } from './shared/AlertItem'
import type { Alert } from '@/features/alerts/types'

interface NeedsAttentionProps {
  alerts: Alert[]
}

export function NeedsAttention({ alerts }: NeedsAttentionProps) {
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority')

  const sorted = [...alerts].sort((a, b) => {
    if (sortBy === 'priority') {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
    }
    if (sortBy === 'date') {
      const dateA = a.date ?? a.createdAt ?? ''
      const dateB = b.date ?? b.createdAt ?? ''
      return dateB.localeCompare(dateA)
    }
    return 0
  })

  // Every item carries a learner chip; household-scoped items (no childId) read "Household".
  const withChip = sorted.map((alert) =>
    alert.childId === null && !alert.childName
      ? { ...alert, childName: 'Household' }
      : alert,
  )

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm" data-testid="attention-hub-card">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-[18px] h-[18px] text-forest-700" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">Attention Hub</h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-100 uppercase tracking-wide">
            {alerts.length} open
          </span>
        </div>
        <select
          id="sortBy"
          name="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'priority' | 'date')}
          className="text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-forest-900"
          autoComplete="off"
        >
          <option value="priority">By Priority</option>
          <option value="date">By Date</option>
        </select>
      </div>
      <div
        className="space-y-2 px-5 pb-5 max-h-[420px] overflow-y-auto"
        data-testid="attention-hub-list"
      >
        {withChip.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </section>
  )
}
