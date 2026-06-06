'use client'

import React, { useState, useEffect } from 'react'
import { createGroupConversation } from '@/features/messaging/front/services/api'
import type { Conversation } from '@/features/messaging/types'

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setValidationError(null) }}
            placeholder="Enter group title"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participants <span className="text-red-500">*</span>
          </label>
          {loadingMembers ? (
            <p className="text-sm text-gray-500">Loading members…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-500">No other household members found</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((m) => (
                <label key={m.userId} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(m.userId)}
                    onChange={() => toggleMember(m.userId)}
                    className="accent-forest-600"
                  />
                  <span className="text-sm text-gray-900">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.email}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {validationError && (
          <p className="text-sm text-red-600 mb-3">{validationError}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-forest-600 text-white rounded hover:bg-forest-700 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}
