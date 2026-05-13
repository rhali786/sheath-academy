'use client'

import React, { useState } from 'react'
import { usePlanner } from '../context/PlannerContext'

export function ChildSubjectFilter() {
  const { selectedChildIds, setSelectedChildIds, selectedSubjectIds, setSelectedSubjectIds, children, subjects } =
    usePlanner()
  const [showChildrenDropdown, setShowChildrenDropdown] = useState(false)
  const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false)

  function toggleChild(childId: string) {
    setSelectedChildIds(
      selectedChildIds.includes(childId)
        ? selectedChildIds.filter(id => id !== childId)
        : [...selectedChildIds, childId]
    )
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

  const selectedChildNames = selectedChildIds
    .map(id => children.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  const selectedSubjectNames = selectedSubjectIds
    .map(id => subjects.find(s => s.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 border-b">
      {/* Children filter */}
      <div className="relative">
        <button
          onClick={() => setShowChildrenDropdown(!showChildrenDropdown)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Children: {selectedChildNames || 'None'}
        </button>
        {showChildrenDropdown && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {children.map(child => (
              <label key={child.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedChildIds.includes(child.id)}
                  onChange={() => toggleChild(child.id)}
                  className="mr-2"
                />
                {child.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Subjects filter */}
      <div className="relative">
        <button
          onClick={() => setShowSubjectsDropdown(!showSubjectsDropdown)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Subjects: {selectedSubjectNames || 'None'}
        </button>
        {showSubjectsDropdown && (
          <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {subjects.map(subject => (
              <label key={subject.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSubjectIds.includes(subject.id)}
                  onChange={() => toggleSubject(subject.id)}
                  className="mr-2"
                />
                {subject.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear button */}
      <button
        onClick={clearFilters}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Clear Filters
      </button>

      {/* Close dropdowns when clicking outside */}
      {(showChildrenDropdown || showSubjectsDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowChildrenDropdown(false)
            setShowSubjectsDropdown(false)
          }}
        />
      )}
    </div>
  )
}
