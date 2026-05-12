'use client'

import { useState, useEffect } from 'react'
import { useHousehold } from '@/features/household/front/context'
import { householdApi } from '@/features/household/front/services/api'
import { ChildrenProvider } from '@/features/children/front/context'
import { ChildList } from '@/features/children/front/components/ChildList'

export default function ChildrenSettingsPage() {
  const { workspace, familyName, refetch } = useHousehold()
  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameSuccess, setRenameSuccess] = useState(false)

  useEffect(() => {
    if (familyName) setRenameName(familyName)
  }, [familyName])

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    if (!renameName.trim() || renameName.trim() === familyName) return
    setRenaming(true)
    setRenameError(null)
    setRenameSuccess(false)
    try {
      await householdApi.updateProfile(renameName.trim())
      refetch()
      setRenameSuccess(true)
    } catch {
      setRenameError('Could not save. Please try again.')
    } finally {
      setRenaming(false)
    }
  }

  if (!workspace) {
    return <div className="p-6 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Household</h2>
        <p className="text-sm text-slate-500 mb-4">Rename your household. This name appears in the header throughout the app.</p>

        <form onSubmit={handleRename} className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
          <label htmlFor="rename-household" className="block text-xs font-medium text-slate-600 mb-1.5">
            Household name
          </label>
          <input
            id="rename-household"
            type="text"
            value={renameName}
            onChange={(e) => { setRenameName(e.target.value); setRenameSuccess(false) }}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900 mb-4"
            maxLength={80}
          />
          {renameError && <p className="text-red-500 text-xs mb-3">{renameError}</p>}
          {renameSuccess && <p className="text-green-600 text-xs mb-3">Household name updated.</p>}
          <button
            type="submit"
            disabled={!renameName.trim() || renameName.trim() === familyName || renaming}
            className="px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition-colors"
          >
            {renaming ? 'Saving…' : 'Save'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Children</h2>
        <p className="text-sm text-slate-500 mb-4">Add and manage profiles for each child in your household.</p>

        <ChildrenProvider householdId={workspace.id}>
          <ChildList />
        </ChildrenProvider>
      </section>

    </div>
  )
}
