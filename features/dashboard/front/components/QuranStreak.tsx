'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { childColors } from '../theme'
import { childScopedHref } from '@/features/lib/front/navigation'
import { SURAHS } from '@/features/quran/front/constants/surahs'
import type { QuranSession } from '../types'
import type { StudentProfile } from '@/features/lib/types'

interface QuranStreakProps {
  quranSessions: QuranSession[]
  children: StudentProfile[]
  selectedChildId: string | null
  onAddSession: (session: any) => Promise<void>
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcStreak(sessions: QuranSession[], childId: string): number {
  const dates = new Set(sessions.filter(s => s.childId === childId).map(s => s.date))
  let streak = 0
  const cur = new Date()
  cur.setHours(0, 0, 0, 0)
  while (true) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    if (!dates.has(key)) break
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

export function QuranStreak({ quranSessions, children, selectedChildId, onAddSession }: QuranStreakProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultChildId, setDefaultChildId] = useState<string>('')
  const [formData, setFormData] = useState({
    childId: '',
    type: 'New memorization',
    surah: '',
    fromAyah: 1,
    toAyah: 1,
    notes: '',
    date: todayLocal(),
  })

  const activeChildren = selectedChildId
    ? children.filter(c => c.id === selectedChildId)
    : children

  const streaks = useMemo(() =>
    activeChildren.map((child, i) => ({
      child,
      streak: calcStreak(quranSessions, child.id),
      color: childColors[i] || childColors[childColors.length - 1],
    })),
    [quranSessions, activeChildren]
  )

  function openModal(childId?: string) {
    const cid = childId ?? activeChildren[0]?.id ?? ''
    setFormData(f => ({ ...f, childId: cid, date: todayLocal() }))
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onAddSession(formData)
    setModalOpen(false)
    setFormData(f => ({ ...f, surah: '', fromAyah: 1, toAyah: 1, notes: '', date: todayLocal() }))
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Quran Streak
        </p>
        <button
          onClick={() => openModal()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-forest-900 text-white hover:bg-forest-800 transition-colors"
        >
          Log Quran Session
        </button>
      </div>

      {activeChildren.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No active children.</p>
      ) : (
        <div className="flex flex-wrap gap-6 mt-2">
          {streaks.map(({ child, streak, color }) => (
            <Link
              key={child.id}
              href={childScopedHref('/quran', child.id)}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label={child.name}
            >
              <div
                className="w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-sm border-4"
                style={{ borderColor: color }}
              >
                <span className="text-2xl font-bold text-slate-900">{streak}</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">days</span>
              </div>
              <p className="text-xs font-medium text-slate-600">{child.name}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Log session modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900">Log Quran Session</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Student</label>
                <select
                  value={formData.childId}
                  onChange={e => setFormData(f => ({ ...f, childId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
                  required
                >
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
                  required
                >
                  <option>New memorization</option>
                  <option>Revision</option>
                  <option>Recitation practice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Surah</label>
                <select
                  value={formData.surah}
                  onChange={e => setFormData(f => ({ ...f, surah: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
                  required
                >
                  <option value="">Select a Surah…</option>
                  {SURAHS.map(s => (
                    <option key={s.number} value={s.name}>
                      {s.number} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">From Ayah</label>
                  <input
                    type="number"
                    value={formData.fromAyah}
                    onChange={e => setFormData(f => ({ ...f, fromAyah: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
                    required min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">To Ayah</label>
                  <input
                    type="number"
                    value={formData.toAyah}
                    onChange={e => setFormData(f => ({ ...f, toAyah: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
                    required min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-900 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800">
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
