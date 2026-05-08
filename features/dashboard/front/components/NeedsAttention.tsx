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
      const priorityOrder = { amber: 0, red: 1, gray: 2 }
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) -
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
    }
    return 0
  })

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Needs Attention</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'priority' | 'date')}
          className="text-sm px-3 py-1 border border-gray-200 rounded-lg bg-white text-gray-700"
        >
          <option value="priority">Priority</option>
          <option value="date">Date</option>
        </select>
      </div>
      <div className="space-y-3">
        {sorted.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </section>
  )
}
