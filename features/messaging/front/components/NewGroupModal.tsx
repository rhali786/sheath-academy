'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createGroupConversation } from '@/features/messaging/front/services/api'
import type { Conversation } from '@/features/messaging/types'
import { Avatar } from '@/features/messaging/front/components/Avatar'

interface HouseholdMember {
  userId: string
  name: string
  email: string
}

interface NewGroupModalProps {
  onClose: () => void
  onCreated: (conversation: Conversation) => void
  currentUserId: string
}

export function NewGroupModal({ onClose, onCreated, currentUserId }: NewGroupModalProps) {
  const [title, setTitle] = useState('')
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
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

  const toggleMember = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setValidationError('Group title is required')
      return
    }
    if (selectedUserIds.length === 0) {
      setValidationError('Please add at least 1 participant')
      return
    }

    setValidationError(null)
    setError(null)
    setSubmitting(true)
    try {
      const res = await createGroupConversation(trimmedTitle, selectedUserIds)
      onCreated(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New group"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">New Group</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Group title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setValidationError(null) }}
            placeholder="Enter group title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Participants <span className="text-red-500">*</span>
          </label>
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
                    selectedUserIds.includes(m.userId)
                      ? 'border-forest-200 bg-forest-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(m.userId)}
                    onChange={() => toggleMember(m.userId)}
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
        </div>

        {validationError && (
          <p className="mb-3 text-sm text-red-600">{validationError}</p>
        )}
        {error && (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-lg bg-forest-900 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}
