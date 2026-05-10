import { useState } from 'react'
import { AlertItem } from './shared/AlertItem'
import type { Alert } from '../types'

interface NeedsAttentionProps {
  alerts: Alert[]
}

export function NeedsAttention({ alerts }: NeedsAttentionProps) {
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority')

  const sorted = [...alerts].sort((a, b) => {
    if (sortBy === 'priority') {
      const order = { red: 0, amber: 1, gray: 2 }
      return (order[a.priority as keyof typeof order] ?? 3) -
             (order[b.priority as keyof typeof order] ?? 3)
    }
    return 0
  })

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-900">Needs Attention</h2>
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
      <div className="space-y-2">
        {sorted.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </section>
  )
}
