'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'
import { todosApi } from '../services/api'
import type { PersonalTodo } from '../../types'

function sortTodos(a: PersonalTodo, b: PersonalTodo): number {
  if (a.done !== b.done) return a.done ? 1 : -1
  return a.sortOrder - b.sortOrder
}

function CardShell({ count, children }: { count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5" data-testid="personal-todo-list">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Personal To-Dos</p>
        {count !== undefined && (
          <span
            data-testid="personal-todo-count"
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 tabular-nums"
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

export function PersonalTodoList() {
  const [todos, setTodos] = useState<PersonalTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    setError(false)
    todosApi.list()
      .then(res => { setTodos([...res.data].sort(sortTodos)); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return
    setAdding(true)
    try {
      const res = await todosApi.create({ text })
      setTodos(prev => [...prev, res.data].sort(sortTodos))
      setNewText('')
    } catch {
      setError(true)
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(todo: PersonalTodo) {
    const done = !todo.done
    try {
      const res = await todosApi.toggle(todo.id, done)
      setTodos(prev => prev.map(t => (t.id === todo.id ? res.data : t)).sort(sortTodos))
    } catch {
      setError(true)
    }
  }

  async function handleDelete(id: string) {
    await todosApi.remove(id)
    setTodos(prev => prev.filter(t => t.id !== id))
    setConfirmDeleteId(null)
  }

  if (loading) {
    return (
      <CardShell>
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      </CardShell>
    )
  }

  if (error) {
    return (
      <CardShell>
        <p className="text-sm text-slate-500 mb-3">Couldn&apos;t load your to-dos.</p>
        <button
          type="button"
          onClick={load}
          className="px-3 py-1.5 bg-forest-900 text-white text-xs font-medium rounded-lg hover:bg-forest-800 transition-colors"
        >
          Retry
        </button>
      </CardShell>
    )
  }

  return (
    <CardShell count={todos.length}>
      {todos.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">No to-dos yet — add one for curriculum or supply planning</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
          {todos.map(todo => (
            <li key={todo.id}>
              {confirmDeleteId === todo.id ? (
                <InlineConfirm
                  message="Delete this to-do?"
                  detail={todo.text}
                  onConfirm={() => handleDelete(todo.id)}
                  onCancel={() => setConfirmDeleteId(null)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => handleToggle(todo)}
                    aria-label={todo.done ? `Mark "${todo.text}" as not done` : `Mark "${todo.text}" as done`}
                    className="w-4 h-4 rounded border-slate-300 text-forest-600 focus:ring-2 focus:ring-forest-500"
                  />
                  <span className={`flex-1 text-sm ${todo.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {todo.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(todo.id)}
                    aria-label={`Delete "${todo.text}"`}
                    className="text-slate-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Add a to-do..."
          aria-label="New to-do text"
          className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
        <button
          type="submit"
          disabled={adding || !newText.trim()}
          aria-label="Add to-do"
          className="flex items-center justify-center w-8 h-8 bg-forest-900 text-white rounded-lg hover:bg-forest-800 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </CardShell>
  )
}
