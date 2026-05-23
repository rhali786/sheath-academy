'use client'

import { useState, useEffect } from 'react'
import { usePlanner } from '../context/PlannerContext'
import { useHousehold } from '@/features/household/front/context'
import { WeekNavigator } from './WeekNavigator'
import { ChildSubjectFilter } from './ChildSubjectFilter'
import { WeekGrid } from './WeekGrid'
import { WeeklyList } from './WeeklyList'
import { EmptyWeekState } from './EmptyWeekState'

export function WeeklyPlannerPage() {
  const { lessons, isInitializing, isLessonsLoading, error } = usePlanner()
  const { loading: householdLoading } = useHousehold()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (householdLoading || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading planner...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error loading planner</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <WeekNavigator />
      <ChildSubjectFilter />

      {isLessonsLoading ? (
        <div className="flex-1 overflow-auto flex items-center justify-center" aria-busy="true">
          <p className="text-gray-500 text-sm">Loading lessons...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <EmptyWeekState lessons={lessons} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-slate-50">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {isMobile ? <WeeklyList /> : <WeekGrid />}
          </div>
        </div>
      )}
    </div>
  )
}
