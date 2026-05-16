'use client'

import { useState, useEffect } from 'react'
import type { EvidenceItem } from '@/features/portfolio/types'
import { portfolioApi } from '../services/api'

interface Props {
  lessonTaskId: string
}

export function LinkedEvidenceList({ lessonTaskId }: Props) {
  const [items, setItems] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    portfolioApi
      .listEvidenceByLessonTask(lessonTaskId)
      .then(res => {
        if (!cancelled) setItems(res.data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message ?? 'Failed to load evidence')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lessonTaskId])

  if (loading) {
    return <p className="text-sm text-gray-500">Loading evidence...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 italic">No evidence linked to this lesson.</p>
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-600">Evidence ({items.length}):</p>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.id} className="text-sm text-gray-700">
            {item.title} — <span className="text-xs text-gray-500">{item.type}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
