'use client'

import { useState, useEffect } from 'react'
import { usePlanner } from '../context/PlannerContext'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { plannerApi } from '@/features/plan/front/services/api'
import { WeekNavigator } from './WeekNavigator'
import { ChildSubjectFilter } from './ChildSubjectFilter'
import { WeekGrid } from './WeekGrid'
import { WeeklyList } from './WeeklyList'
import { EmptyWeekState } from './EmptyWeekState'
import { LessonTaskForm, type LessonFormData } from './LessonTaskForm'

export function WeeklyPlannerPage() {
  const { lessons, isInitializing, isLessonsLoading, error, refreshLessons } = usePlanner()
  const { loading: householdLoading, householdProfile, studentProfiles, allSubjects } = useHousehold()
  const { selectedChildId } = useLearner()
  const [isMobile, setIsMobile] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function handleAddLesson(data: LessonFormData) {
    const householdId = householdProfile?.id ?? ''
    await plannerApi.createLesson({ ...data, householdId })
    refreshLessons?.()
    setShowAddForm(false)
  }

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
      <WeekNavigator
        onToggleAddLesson={() => setShowAddForm(v => !v)}
        showAddForm={showAddForm}
      />
      {showAddForm && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200 bg-white">
          <h2 className="form-section-heading">Add lesson</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <LessonTaskForm
              children={studentProfiles.filter(c => c.isActive !== false)}
              subjects={allSubjects}
              defaultSelectedChildIds={selectedChildId ? [selectedChildId] : undefined}
              onSubmit={handleAddLesson}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
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
