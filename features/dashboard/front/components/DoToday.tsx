import type { Task, Child } from '../types'

interface DoTodayProps {
  tasks: Task[]
  children: Child[]
  onTaskToggle: (taskId: string, completed: boolean) => void
}

const subjectColors: Record<string, string> = {
  QURAN:             'bg-forest-100 text-forest-900',
  ARABIC:            'bg-sky-100 text-sky-700',
  MATH:              'bg-orange-100 text-orange-800',
  READING:           'bg-emerald-100 text-emerald-800',
  SCIENCE:           'bg-indigo-100 text-indigo-800',
  'ISLAMIC STUDIES': 'bg-violet-100 text-violet-800',
  ENGLISH:           'bg-cyan-100 text-cyan-800',
  HISTORY:           'bg-amber-100 text-amber-800',
}

const statusBadgeMap: Record<string, string> = {
  Ready:         'badge-blue',
  Overdue:       'badge-red',
  'In progress': 'badge-amber',
}

export function DoToday({ tasks, children, onTaskToggle }: DoTodayProps) {
  const groupedTasks = children.reduce((acc, child) => {
    acc[child.id] = tasks.filter(t => t.childId === child.id)
    return acc
  }, {} as Record<string, Task[]>)

  const familyTasks = tasks.filter(t => t.childId === 'family')

  const renderTaskGroup = (label: string, childTasks: Task[]) => {
    const completed = childTasks.filter(t => t.completed).length
    const total = childTasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
      <div key={label} className="bg-white rounded-xl shadow-sm p-6 mb-5">
        {/* Group header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
          <span className="text-sm font-bold text-forest-900 tabular-nums">{completed}/{total}</span>
        </div>

        {/* Thin progress bar */}
        <div className="mb-5 bg-slate-100 rounded-full h-1">
          <div
            className="bg-forest-900 h-1 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Task rows — Notion-style hover states, no per-row borders */}
        <div className="space-y-0.5">
          {childTasks.map((task) => (
            <label
              key={task.id}
              className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onTaskToggle(task.id, !task.completed)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-forest-900 focus:ring-forest-700 cursor-pointer flex-shrink-0 accent-forest-900"
                aria-label={`Toggle ${task.description}`}
              />
              <div className="flex-grow min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className={`badge ${subjectColors[task.subject] || 'bg-slate-100 text-slate-700'}`}>
                    {task.subject}
                  </span>
                  <span className={`badge ${statusBadgeMap[task.status] || 'badge-gray'}`}>
                    {task.status}
                  </span>
                </div>
                <p className={`text-sm leading-snug ${
                  task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                }`}>
                  {task.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Quick-action footer */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
          <button className="flex-1 px-3 py-2 bg-forest-50 text-forest-900 rounded-lg font-medium text-xs hover:bg-forest-100 transition-colors">
            Log Quran
          </button>
          <button className="flex-1 px-3 py-2 bg-sky-50 text-sky-700 rounded-lg font-medium text-xs hover:bg-sky-100 transition-colors">
            Add Evidence
          </button>
          <button className="flex-1 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg font-medium text-xs hover:bg-slate-100 transition-colors">
            Move Work
          </button>
        </div>
      </div>
    )
  }

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-5">Do Today</h2>
      {familyTasks.length > 0 && renderTaskGroup('🏠 Family', familyTasks)}
      {children.map((child) =>
        renderTaskGroup(
          `${child.avatar} ${child.name} · Grade ${child.grade}`,
          groupedTasks[child.id] || []
        )
      )}
    </section>
  )
}
