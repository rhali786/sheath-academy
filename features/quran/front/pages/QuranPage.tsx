'use client'

import { useState, useEffect } from 'react'
import { Pencil, X, Check } from 'lucide-react'
import { quranApi } from '@/features/quran/front/services/api'
import type { QuranSession } from '@/features/lib/types'

const SESSION_TYPES = ['Revision', 'Recitation', 'Memorisation', 'Listening', 'Other']

interface EditState {
  type: string
  surah: string
  fromAyah: string
  toAyah: string
  notes: string
  date: string
}

function toEditState(s: QuranSession): EditState {
  return {
    type: s.type,
    surah: s.surah,
    fromAyah: String(s.fromAyah),
    toAyah: String(s.toAyah),
    notes: s.notes ?? '',
    date: s.date,
  }
}

export default function QuranPage() {
  const [sessions, setSessions] = useState<QuranSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    quranApi.getSessions()
      .then(res => {
        const sorted = [...res.data.sessions].sort((a, b) => b.date.localeCompare(a.date))
        setSessions(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function startEdit(session: QuranSession) {
    setEditingId(session.id)
    setEditForm(toEditState(session))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function saveEdit(id: string) {
    if (!editForm) return
    setSaving(true)
    try {
      const res = await quranApi.updateSession(id, {
        type: editForm.type,
        surah: editForm.surah.trim(),
        fromAyah: Number(editForm.fromAyah),
        toAyah: Number(editForm.toAyah),
        notes: editForm.notes.trim(),
        date: editForm.date,
      })
      setSessions(prev =>
        [...prev.map(s => s.id === id ? res.data : s)].sort((a, b) => b.date.localeCompare(a.date))
      )
      setEditingId(null)
      setEditForm(null)
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

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
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {editingId === s.id && editForm ? (
                <div className="p-4 space-y-3">
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 min-w-32">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                      <select
                        value={editForm.type}
                        onChange={e => setEditForm(f => f ? { ...f, type: e.target.value } : f)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
                      >
                        {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-32">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={e => setEditForm(f => f ? { ...f, date: e.target.value } : f)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Surah</label>
                    <input
                      type="text"
                      value={editForm.surah}
                      onChange={e => setEditForm(f => f ? { ...f, surah: e.target.value } : f)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">From Ayah</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.fromAyah}
                        onChange={e => setEditForm(f => f ? { ...f, fromAyah: e.target.value } : f)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">To Ayah</label>
                      <input
                        type="number"
                        min={1}
                        value={editForm.toAyah}
                        onChange={e => setEditForm(f => f ? { ...f, toAyah: e.target.value } : f)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={e => setEditForm(f => f ? { ...f, notes: e.target.value } : f)}
                      rows={2}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(s.id)}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs text-white bg-forest-900 hover:bg-forest-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{s.surah}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.type} · Ayah {s.fromAyah}–{s.toAyah}</p>
                    {s.notes && <p className="text-xs text-slate-400 mt-1">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-slate-400">{s.date}</p>
                    <button
                      onClick={() => startEdit(s)}
                      aria-label="Edit session"
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
