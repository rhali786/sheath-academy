'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createDirectConversation } from '@/features/messaging/front/services/api'
import type { Conversation } from '@/features/messaging/types'
import { Avatar } from '@/features/messaging/front/components/Avatar'

interface HouseholdMember {
  userId: string
  name: string
  email: string
}

interface NewMessageModalProps {
  onClose: () => void
  onCreated: (conversation: Conversation) => void
  currentUserId: string
}

type TabId = 'household' | 'email'

export function NewMessageModal({ onClose, onCreated, currentUserId }: NewMessageModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('household')
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/household/members')
      .then((r) => r.json())
      .then((body) => {
        if (!active) return
        const raw: any[] = body?.data?.members ?? []
        setMembers(raw.filter((m) => m.userId !== currentUserId))
        setLoadingMembers(false)
      })
      .catch(() => {
        if (active) setLoadingMembers(false)
      })
    return () => { active = false }
  }, [currentUserId])

  const handleHouseholdSubmit = async () => {
    if (!selectedUserId) {
      setError('Please select a recipient')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await createDirectConversation({ userId: selectedUserId })
      onCreated(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmailSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter an email address')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await createDirectConversation({ email: trimmed })
      onCreated(res.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start conversation'
      setError(msg.toLowerCase().includes('no account') || msg.toLowerCase().includes('not found')
        ? 'No account found with that email address'
        : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New message"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">New Message</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('household'); setError(null) }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'household'
                ? 'border-forest-600 text-forest-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Household
          </button>
          <button
            onClick={() => { setActiveTab('email'); setError(null) }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'email'
                ? 'border-forest-600 text-forest-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            By Email
          </button>
        </div>

        {activeTab === 'household' && (
          <div>
            {loadingMembers ? (
              <p className="text-sm text-slate-500">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-500">No other household members found</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {members.map((m) => (
                  <label
                    key={m.userId}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedUserId === m.userId
                        ? 'border-forest-200 bg-forest-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="member"
                      value={m.userId}
                      checked={selectedUserId === m.userId}
                      onChange={() => setSelectedUserId(m.userId)}
                      className="accent-forest-600"
                    />
                    <Avatar name={m.name} email={m.email} size="sm" />
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">{m.name}</span>
                      <span className="block truncate text-xs text-slate-500">{m.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleHouseholdSubmit}
                disabled={submitting || !selectedUserId}
                className="rounded-lg bg-forest-900 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800 disabled:opacity-50"
              >
                {submitting ? 'Starting…' : 'Start Conversation'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSubmit}
                disabled={submitting || !email.trim()}
                className="rounded-lg bg-forest-900 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800 disabled:opacity-50"
              >
                {submitting ? 'Starting…' : 'Start Conversation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
