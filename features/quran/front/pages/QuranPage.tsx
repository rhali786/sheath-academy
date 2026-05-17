'use client'

import { useState, useEffect } from 'react'
import { quranApi } from '@/features/quran/front/services/api'
import type { QuranSession } from '@/features/lib/types'

export default function QuranPage() {
  const [sessions, setSessions] = useState<QuranSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    quranApi.getSessions()
      .then(res => setSessions(res.data.sessions))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Quran Studies</h1>
      <p className="text-sm text-slate-500 mb-8">Track Quran memorisation and recitation sessions.</p>

      {loading ? (
        <p className="text-sm text-slate-400">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-400 text-sm">No sessions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">{sessions.length} session{sessions.length !== 1 ? 's' : ''} logged</p>
          {sessions.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{s.surah}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.type} · Ayah {s.fromAyah}–{s.toAyah}</p>
                </div>
                <p className="text-xs text-slate-400 shrink-0">{s.date}</p>
              </div>
              {s.notes && <p className="text-xs text-slate-500 mt-2">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
