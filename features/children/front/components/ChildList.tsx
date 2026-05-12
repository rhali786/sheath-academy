'use client'

import { useState } from 'react'
import type { StudentProfile } from '@/features/lib/types'
import { useChildren } from '../context'
import { ChildCard } from './ChildCard'
import { ChildForm } from './ChildForm'

export function ChildList() {
  const { children, allChildren, householdId, showArchived, setShowArchived, loading, createChild, updateChild, archiveChild, restoreChild } = useChildren()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingChild, setEditingChild] = useState<StudentProfile | null>(null)
  const [archiveConfirm, setArchiveConfirm] = useState<{ id: string; name: string } | null>(null)

  async function handleCreateChild(data: Parameters<typeof createChild>[0]) {
    try {
      await createChild(data)
      setIsFormOpen(false)
    } catch (err) {
      console.error('Failed to create child:', err)
    }
  }

  async function handleUpdateChild(data: Parameters<typeof updateChild>[1]) {
    if (!editingChild) return
    try {
      await updateChild(editingChild.id, data)
      setEditingChild(null)
    } catch (err) {
      console.error('Failed to update child:', err)
    }
  }

  async function handleArchiveChild(child: StudentProfile) {
    setArchiveConfirm({ id: child.id, name: child.name })
  }

  async function confirmArchive() {
    if (!archiveConfirm) return
    try {
      await archiveChild(archiveConfirm.id)
      setArchiveConfirm(null)
    } catch (err) {
      console.error('Failed to archive child:', err)
    }
  }

  async function handleRestoreChild(child: StudentProfile) {
    try {
      await restoreChild(child.id)
    } catch (err) {
      console.error('Failed to restore child:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading children...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Your children</h2>
          {allChildren.length > 0 && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded"
              />
              <span className="text-slate-600">Show archived</span>
            </label>
          )}
        </div>
        {!isFormOpen && !editingChild && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="text-xs px-3 py-2 rounded bg-forest-900 text-white hover:bg-forest-800 transition-colors"
          >
            + Add child
          </button>
        )}
      </div>

      {isFormOpen && !editingChild && (
        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-slate-900 mb-3">Add a new child</h3>
          <ChildForm
            householdId={householdId || ''}
            onSubmit={handleCreateChild}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      )}

      {editingChild && (
        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-slate-900 mb-3">Edit {editingChild.name}</h3>
          <ChildForm
            householdId={householdId || ''}
            child={editingChild}
            onSubmit={handleUpdateChild}
            onCancel={() => setEditingChild(null)}
          />
        </div>
      )}

      {archiveConfirm && (
        <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded">
          <p className="text-sm text-amber-900 mb-2">
            Archive <strong>{archiveConfirm.name}</strong>? They'll be hidden from active lists but can be restored.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmArchive}
              className="text-xs px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Confirm archive
            </button>
            <button
              onClick={() => setArchiveConfirm(null)}
              className="text-xs px-3 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {children.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>{showArchived ? 'No children.' : 'No active children. Add one to get started.'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {children.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              onEdit={(c) => setEditingChild(c)}
              onArchive={handleArchiveChild}
              onRestore={handleRestoreChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}
