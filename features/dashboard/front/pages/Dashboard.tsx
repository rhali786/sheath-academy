import { useState, useEffect } from 'react'
import { Header } from '@/features/layout/front/components/Header'
import { TodayState } from '../components/TodayState'
import { DoToday } from '../components/DoToday'
import { NeedsAttention } from '../components/NeedsAttention'
import { PerChildProgress } from '../components/PerChildProgress'
import { QuranStudies } from '../components/QuranStudies'
import { RecordsProof } from '../components/RecordsProof'
import { useContext_Dashboard } from '../context'
import { dashboardApi } from '../services/api'

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState('Today')
  const {
    children, tasks, alerts, quranSessions, records, metrics,
    loading, error, toggleTask, addQuranSession,
  } = useContext_Dashboard()

  const [progressData, setProgressData] = useState({})

  useEffect(() => {
    dashboardApi.getProgress()
      .then(res => setProgressData(res.data))
      .catch(err => console.error('Failed to fetch progress data:', err))
  }, [])

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

  return (
    <div className="bg-slate-50 min-h-screen">
      <Header onTabChange={setSelectedTab} selectedTab={selectedTab} />

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
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
            <p className="text-slate-400 mt-2 text-sm">Settings coming soon.</p>
          </div>
        </div>
      )}
    </div>
  )
}
