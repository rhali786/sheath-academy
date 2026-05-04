import React, { useState } from 'react'
import { Header } from '../components/Header'
import { TodayState } from '../components/TodayState'
import { DoToday } from '../components/DoToday'
import { NeedsAttention } from '../components/NeedsAttention'
import { PerChildProgress } from '../components/PerChildProgress'
import { QuranStudies } from '../components/QuranStudies'
import { RecordsProof } from '../components/RecordsProof'
import { useContext_Dashboard } from '../App'
import { dashboardApi } from '../services/api'

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState('Today')
  const { children, tasks, alerts, quranSessions, records, metrics, loading, error, toggleTask, addQuranSession } = useContext_Dashboard()

  // Fetch progress data
  const [progressData, setProgressData] = React.useState({})

  React.useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await dashboardApi.getProgress()
        setProgressData(res.data)
      } catch (err) {
        console.error('Failed to fetch progress data:', err)
      }
    }
    fetchProgress()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header onTabChange={setSelectedTab} selectedTab={selectedTab} />

      {selectedTab === 'Today' && (
        <>
          <TodayState metrics={metrics} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="card-lg">
            <h2 className="text-2xl font-bold text-gray-900">Weekly View</h2>
            <p className="text-gray-600 mt-2">Weekly analytics coming soon...</p>
          </div>
        </div>
      )}

      {selectedTab === 'Reports' && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="card-lg">
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="text-gray-600 mt-2">Detailed reports coming soon...</p>
          </div>
        </div>
      )}

      {selectedTab === 'Settings' && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="card-lg">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600 mt-2">Settings coming soon...</p>
          </div>
        </div>
      )}
    </div>
  )
}
