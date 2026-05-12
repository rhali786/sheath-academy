'use client'

import { useState, useEffect } from 'react'
import { TodayState } from '../components/TodayState'
import { DoToday } from '../components/DoToday'
import { NeedsAttention } from '../components/NeedsAttention'
import { PerChildProgress } from '../components/PerChildProgress'
import { QuranStudies } from '../components/QuranStudies'
import { RecordsProof } from '../components/RecordsProof'
import { useContext_Dashboard } from '../context'
import { useHousehold } from '@/features/household/front/context'
import { HouseholdSetup } from '@/features/household/front/components/HouseholdSetup'
import { useNavigation } from '@/features/layout/front/context/NavigationContext'
import { dashboardApi } from '../services/api'
import { householdApi } from '@/features/household/front/services/api'

export default function Dashboard() {
  const { selectedTab } = useNavigation()
  const {
    children, tasks, alerts, quranSessions, records, metrics,
    loading, error, toggleTask, addQuranSession,
  } = useContext_Dashboard()
  const { familyName, needsSetup, refetch } = useHousehold()

  const [progressData, setProgressData] = useState({})
  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [renameSuccess, setRenameSuccess] = useState(false)

  useEffect(() => {
    dashboardApi.getProgress()
      .then(res => setProgressData(res.data))
      .catch(err => console.error('Failed to fetch progress data:', err))
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-forest-100 border-t-forest-900 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400 font-medium">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-forest-900 text-white rounded-lg text-sm font-medium hover:bg-forest-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return <HouseholdSetup />
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {selectedTab === 'Today' && (
        <>
          <TodayState metrics={metrics} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DoToday tasks={tasks} children={children} onTaskToggle={toggleTask} />
              </div>
              <div>
                <NeedsAttention alerts={alerts} />
              </div>
            </div>
          </div>

          <PerChildProgress children={children} progressData={progressData} />
          <QuranStudies children={children} quranSessions={quranSessions} onAddSession={addQuranSession} />
          <RecordsProof records={records} />
        </>
      )}

      {selectedTab === 'Weekly' && (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-slate-900">Weekly View</h2>
            <p className="text-slate-400 mt-2 text-sm">Weekly analytics coming soon.</p>
          </div>
        </div>
      )}

      {selectedTab === 'Reports' && (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
            <p className="text-slate-400 mt-2 text-sm">Detailed reports coming soon.</p>
          </div>
        </div>
      )}

      {selectedTab === 'Settings' && (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Household settings</h2>
            <p className="text-sm text-slate-400 mb-6">Rename your household. This name appears in the header and throughout your dashboard.</p>

            <form onSubmit={handleRename}>
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
          </div>
        </div>
      )}
    </div>
  )
}
