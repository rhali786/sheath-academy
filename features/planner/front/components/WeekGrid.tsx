'use client'

import { usePlanner } from '../context/PlannerContext'

function getDayOfWeekLabel(dayIndex: number): string {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return labels[dayIndex]
}

function isWeekend(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function WeekGrid() {
  const { lessons, selectedWeek, weekStartDay, children, subjects, selectedChildIds, selectedSubjectIds } = usePlanner()

  // Calculate week start date using local time (matches PlannerContext.getWeekStartDate)
  const d = new Date(selectedWeek)
  const dayOfWeek = d.getDay()
  const daysFromStart = weekStartDay === 'Monday' ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1) : dayOfWeek
  d.setDate(d.getDate() - daysFromStart)
  const weekStart = new Date(d)

  const orderedDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
    return date
  })

  // Build row identifiers (child x subject combinations) — filter to selected only
  const rows = children
    .filter(child => selectedChildIds.includes(child.id))
    .flatMap(child =>
      subjects
        .filter(subject => selectedSubjectIds.includes(subject.id))
        .map(subject => ({ childId: child.id, childName: child.name, subjectId: subject.id, subjectName: subject.name }))
    )

  function getLessonForCell(dateStr: string, childId: string, subjectId: string) {
    return lessons.find(l => l.dueDate === dateStr && l.childId === childId && l.subjectId === subjectId)
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="bg-slate-50 px-4 py-3 text-sm font-semibold text-left w-40">
              <span className="text-slate-700">Child / Subject</span>
            </th>
            {orderedDays.map((date) => {
              const dow = date.getDay()
              const isWeekendDay = isWeekend(dow)
              const displayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const dayLabel = getDayOfWeekLabel(dow)

              return (
                <th
                  key={formatLocalDate(date)}
                  className={`px-3 py-3 text-sm font-semibold text-center min-w-32 border-l border-slate-200 ${
                    isWeekendDay ? 'bg-slate-50 text-slate-400 opacity-60' : 'bg-forest-50'
                  }`}
                >
                  <div className={isWeekendDay ? 'text-slate-500' : 'text-forest-900'}>{dayLabel}</div>
                  <div className={`text-xs ${isWeekendDay ? 'text-slate-400' : 'text-forest-700'}`}>{displayStr}</div>
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
                const dateStr = formatLocalDate(date)
                const dow = date.getDay()
                const isWeekendDay = isWeekend(dow)
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
