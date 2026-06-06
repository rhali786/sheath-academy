'use client'

import React, { useState, useEffect } from 'react'
import { createDirectConversation } from '@/features/messaging/front/services/api'
import type { Conversation } from '@/features/messaging/types'

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => { setActiveTab('household'); setError(null) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'household'
                ? 'border-forest-600 text-forest-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Household
          </button>
          <button
            onClick={() => { setActiveTab('email'); setError(null) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'email'
                ? 'border-forest-600 text-forest-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            By Email
          </button>
        </div>

        {activeTab === 'household' && (
          <div>
            {loadingMembers ? (
              <p className="text-sm text-gray-500">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-500">No other household members found</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((m) => (
                  <label key={m.userId} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="member"
                      value={m.userId}
                      checked={selectedUserId === m.userId}
                      onChange={() => setSelectedUserId(m.userId)}
                      className="accent-forest-600"
                    />
                    <span className="text-sm text-gray-900">{m.name}</span>
                    <span className="text-xs text-gray-500">{m.email}</span>
                  </label>
                ))}
              </div>
            )}
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleHouseholdSubmit}
                disabled={submitting || !selectedUserId}
                className="px-4 py-2 text-sm bg-forest-600 text-white rounded hover:bg-forest-700 disabled:opacity-50"
              >
                {submitting ? 'Starting…' : 'Start Conversation'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSubmit}
                disabled={submitting || !email.trim()}
                className="px-4 py-2 text-sm bg-forest-600 text-white rounded hover:bg-forest-700 disabled:opacity-50"
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
