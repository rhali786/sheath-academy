'use client'

import { usePlanner } from '../context/PlannerContext'

function getDayOfWeekLabel(dayIndex: number): string {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return labels[dayIndex]
}

function isWeekend(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6
}

export function WeekGrid() {
  const { lessons, selectedWeek, weekStartDay, children, subjects } = usePlanner()

  // Calculate week start date
  const d = new Date(selectedWeek)
  const dayOfWeek = d.getDay()
  const offset = weekStartDay === 'Monday' ? (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) : dayOfWeek
  d.setDate(d.getDate() - offset)
  const weekStart = new Date(d)

  // Get all days of the week (already in correct order based on weekStart calculation)
  const orderedDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  // Build row identifiers (child x subject combinations)
  const rows = children.flatMap(child =>
    subjects.map(subject => ({ childId: child.id, childName: child.name, subjectId: subject.id, subjectName: subject.name }))
  )

  // Get lesson for a specific day, child, and subject
  function getLessonForCell(date: string, childId: string, subjectId: string) {
    return lessons.find(l => l.dueDate === date && l.childId === childId && l.subjectId === subjectId)
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="bg-slate-50 px-4 py-3 text-sm font-semibold text-left w-40">
              <span className="text-slate-700">Child / Subject</span>
            </th>
            {orderedDays.map((date, idx) => {
              const dayOfWeek = date.getDay()
              const isWeekendDay = isWeekend(dayOfWeek)
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const dayLabel = getDayOfWeekLabel(dayOfWeek)

              return (
                <th
                  key={date.toISOString()}
                  className={`px-3 py-3 text-sm font-semibold text-center min-w-32 border-l border-slate-200 ${
                    isWeekendDay ? 'bg-slate-50 text-slate-400 opacity-60' : 'bg-forest-50'
                  }`}
                >
                  <div className={isWeekendDay ? 'text-slate-500' : 'text-forest-900'}>{dayLabel}</div>
                  <div className={`text-xs ${isWeekendDay ? 'text-slate-400' : 'text-forest-700'}`}>{dateStr}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={`${row.childId}-${row.subjectId}`} className={`border-b border-slate-200 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="bg-slate-50 px-4 py-3 text-sm font-medium sticky left-0 z-10 border-r border-slate-200">
                <div className="font-semibold text-slate-900">{row.childName}</div>
                <div className="text-xs text-slate-600">{row.subjectName}</div>
              </td>
              {orderedDays.map(date => {
                const dateStr = date.toISOString().split('T')[0]
                const dayOfWeek = date.getDay()
                const isWeekendDay = isWeekend(dayOfWeek)
                const lesson = getLessonForCell(dateStr, row.childId, row.subjectId)

                return (
                  <td
                    key={dateStr}
                    className={`px-3 py-3 text-sm align-top border-l border-slate-200 ${
                      isWeekendDay ? 'bg-slate-50 text-slate-600 opacity-60' : 'bg-white'
                    }`}
                  >
                    {lesson && (
                      <div className="p-2.5 bg-forest-50 rounded-md border border-forest-200 hover:shadow-md transition-shadow">
                        <div className="font-medium text-forest-900">{lesson.title}</div>
                        {lesson.description && <div className="text-xs text-forest-700 mt-1">{lesson.description}</div>}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
