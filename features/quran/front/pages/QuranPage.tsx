'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import { quranApi } from '@/features/quran/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'
import type { QuranSession } from '@/features/lib/types'
import type { StudentProfile } from '@/features/lib/types'

const SESSION_TYPES = ['New memorisation', 'Revision', 'Recitation', 'Full revision', 'Memorisation', 'Listening', 'Other']
type DateSort = 'desc' | 'asc'

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

interface AddState {
  childId: string
  type: string
  surah: string
  fromAyah: string
  toAyah: string
  notes: string
}

function emptyAdd(defaultChildId = ''): AddState {
  return { childId: defaultChildId, type: SESSION_TYPES[0], surah: '', fromAyah: '', toAyah: '', notes: '' }
}

export default function QuranPage() {
  const searchParams = useSearchParams()
  const [sessions, setSessions] = useState<QuranSession[]>([])
  const [children, setChildren] = useState<StudentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddState>(emptyAdd())
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [filterChildId, setFilterChildId] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [dateSort, setDateSort] = useState<DateSort>('desc')

  useEffect(() => {
    childrenApi.getAllChildren()
      .then(res => {
        setChildren(res.data)
        if (res.data.length > 0) {
          setAddForm(prev => ({ ...prev, childId: prev.childId || res.data[0].id }))
        }
      })
      .catch(() => {})
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.childId || !addForm.surah.trim()) {
      setAddError('Child and Surah are required.')
      return
    }
    setAddSaving(true)
    setAddError(null)
    try {
      const res = await quranApi.addSession({
        childId: addForm.childId,
        type: addForm.type,
        surah: addForm.surah.trim(),
        fromAyah: Number(addForm.fromAyah) || 1,
        toAyah: Number(addForm.toAyah) || 1,
        notes: addForm.notes.trim(),
      })
      setSessions(prev => [res.data, ...prev])
      setAddForm(emptyAdd(addForm.childId))
    } catch {
      setAddError('Failed to save session. Please try again.')
    } finally {
      setAddSaving(false)
    }
  }

  useEffect(() => {
    quranApi.getSessions()
      .then(res => setSessions(res.data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Sync URL childId → filterChildId after children load and on URL changes
  useEffect(() => {
    if (children.length === 0) return
    const urlChildId = searchParams.get('childId')
    const matched = urlChildId ? children.find(c => c.id === urlChildId) : null
    setFilterChildId(matched ? matched.id : '')
  }, [searchParams, children])

  const displayedSessions = useMemo(() => {
    let list = sessions
    if (filterChildId) list = list.filter(s => s.childId === filterChildId)
    if (filterType)    list = list.filter(s => s.type === filterType)
    return [...list].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date)
      return dateSort === 'asc' ? cmp : -cmp
    })
  }, [sessions, filterChildId, filterType, dateSort])

  function startEdit(session: QuranSession) {
    setConfirmDeleteId(null)
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
      setSessions(prev => prev.map(s => s.id === id ? res.data : s))
      setEditingId(null)
      setEditForm(null)
    } catch {
      // keep form open on error
    } finally {
      setSaving(false)
    }
  }

  function startConfirmDelete(id: string) {
    setEditingId(null)
    setEditForm(null)
    setConfirmDeleteId(id)
  }

  function cancelDelete() {
    setConfirmDeleteId(null)
  }

  async function confirmDelete(id: string) {
    setDeletingId(id)
    try {
      await quranApi.deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      setConfirmDeleteId(null)
    } catch {
      // keep confirmation open on error
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-title mb-0">Quran Studies</h1>
        <button
          type="button"
          onClick={() => setShowAddForm(v => !v)}
          className="px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800"
        >
          {showAddForm ? 'Cancel' : 'Log session'}
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-8">Track Quran memorisation and recitation sessions.</p>

      {/* Add session form */}
      {showAddForm && <div className="mb-8">
        <h2 className="form-section-heading">Log session</h2>
        <div className="add-form-card">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {children.length > 1 && (
                <div className="flex-1 min-w-36">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Child</label>
                  <select
                    value={addForm.childId}
                    onChange={e => setAddForm(f => ({ ...f, childId: e.target.value }))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-900"
                  >
                    {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex-1 min-w-36">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                <select
                  value={addForm.type}
                  onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-900"
                >
                  {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-36">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Surah</label>
                <input
                  type="text"
                  value={addForm.surah}
                  onChange={e => setAddForm(f => ({ ...f, surah: e.target.value }))}
                  placeholder="e.g. Al-Fatiha"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">From ayah</label>
                <input
                  type="number"
                  min={1}
                  value={addForm.fromAyah}
                  onChange={e => setAddForm(f => ({ ...f, fromAyah: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">To ayah</label>
                <input
                  type="number"
                  min={1}
                  value={addForm.toAyah}
                  onChange={e => setAddForm(f => ({ ...f, toAyah: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any notes about this session…"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-900"
              />
            </div>
            {addError && <p className="text-xs text-red-600">{addError}</p>}
            <button
              type="submit"
              disabled={addSaving}
              className="px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
            >
              {addSaving ? 'Saving…' : 'Log session'}
            </button>
          </form>
        </div>
      </div>}

      {/* Filters */}
      {!loading && sessions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <select
            value={filterChildId}
            onChange={e => setFilterChildId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
          >
            <option value="">All children</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
          >
            <option value="">All types</option>
            {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select
            value={dateSort}
            onChange={e => setDateSort(e.target.value as DateSort)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-900"
          >
            <option value="desc">Date: newest first</option>
            <option value="asc">Date: oldest first</option>
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading sessions…</p>
      ) : displayedSessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-400 text-sm">{sessions.length === 0 ? 'No sessions logged yet.' : 'No sessions match the current filters.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">{displayedSessions.length} of {sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          {displayedSessions.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {editingId === s.id && editForm ? (
                /* Edit expansion */
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
                      aria-label="Cancel edit"
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(s.id)}
                      disabled={saving}
                      aria-label="Save session"
                      className="flex items-center gap-1 text-xs text-white bg-forest-900 hover:bg-forest-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : confirmDeleteId === s.id ? (
                /* Delete confirmation panel */
                <div className="p-4 bg-red-50 border-t border-red-100">
                  <p className="text-sm text-red-700 font-medium mb-3">Delete this session?</p>
                  <p className="text-xs text-red-600 mb-3">
                    {s.surah} · {s.type} · {s.date}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelDelete}
                      aria-label="Cancel delete"
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg bg-white transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      onClick={() => confirmDelete(s.id)}
                      disabled={deletingId === s.id}
                      aria-label="Confirm delete session"
                      className="flex items-center gap-1 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" /> {deletingId === s.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Read state */
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
                    <button
                      onClick={() => startConfirmDelete(s.id)}
                      aria-label="Delete session"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
