'use client'

import React, { useState } from 'react'
import { usePlanner } from '../context/PlannerContext'

export function ChildSubjectFilter() {
  const { selectedChildIds, setSelectedChildIds, selectedSubjectIds, setSelectedSubjectIds, children, subjects } =
    usePlanner()
  const [showChildrenDropdown, setShowChildrenDropdown] = useState(false)
  const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false)

  function toggleChild(childId: string) {
    const updated = selectedChildIds.includes(childId)
      ? selectedChildIds.filter(id => id !== childId)
      : [...selectedChildIds, childId]

    setSelectedChildIds(updated)

    // When clearing all children, also clear subjects (directional relationship)
    if (updated.length === 0) {
      setSelectedSubjectIds([])
    }
  }

  function toggleSubject(subjectId: string) {
    setSelectedSubjectIds(
      selectedSubjectIds.includes(subjectId)
        ? selectedSubjectIds.filter(id => id !== subjectId)
        : [...selectedSubjectIds, subjectId]
    )
  }

  function clearFilters() {
    setSelectedChildIds(children.map(c => c.id))
    setSelectedSubjectIds(subjects.map(s => s.id))
  }

  const selectedChildCount = selectedChildIds.length
  const selectedSubjectCount = selectedSubjectIds.length

  return (
    <div className="sticky top-[65px] z-20 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 py-4">
          {/* Children filter */}
          <div className="relative">
            <button
              onClick={() => setShowChildrenDropdown(!showChildrenDropdown)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
            >
              Children ({selectedChildCount})
            </button>
            {showChildrenDropdown && (
              <div className="absolute top-full left-0 z-50 mt-2 w-48 bg-white border border-slate-300 rounded-lg shadow-xl">
                <div className="max-h-64 overflow-y-auto py-1">
                  {children.map(child => (
                    <label key={child.id} className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedChildIds.includes(child.id)}
                        onChange={() => toggleChild(child.id)}
                        className="w-4 h-4 mr-3 text-forest-600 rounded border-slate-300 focus:ring-2 focus:ring-forest-500"
                      />
                      <span className="text-sm text-slate-700">{child.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subjects filter */}
          <div className="relative">
            <button
              onClick={() => setShowSubjectsDropdown(!showSubjectsDropdown)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transition-colors"
            >
              Subjects ({selectedSubjectCount})
            </button>
            {showSubjectsDropdown && (
              <div className="absolute top-full left-0 z-50 mt-2 w-48 bg-white border border-slate-300 rounded-lg shadow-xl">
                <div className="max-h-64 overflow-y-auto py-1">
                  {subjects.map(subject => (
                    <label key={subject.id} className="flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.includes(subject.id)}
                        onChange={() => toggleSubject(subject.id)}
                        className="w-4 h-4 mr-3 text-forest-600 rounded border-slate-300 focus:ring-2 focus:ring-forest-500"
                      />
                      <span className="text-sm text-slate-700">{subject.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear button */}
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            Clear
          </button>

          {/* Active filter summary */}
          {(selectedChildCount < children.length || selectedSubjectCount < subjects.length) && (
            <span className="text-xs text-slate-500 ml-1">
              {selectedChildCount < children.length
                ? `${selectedChildCount} of ${children.length} children`
                : 'All children'}
              {' · '}
              {selectedSubjectCount < subjects.length
                ? `${selectedSubjectCount} of ${subjects.length} subjects`
                : 'All subjects'}
            </span>
          )}

          {/* Close dropdowns when clicking outside */}
          {(showChildrenDropdown || showSubjectsDropdown) && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setShowChildrenDropdown(false)
                setShowSubjectsDropdown(false)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
