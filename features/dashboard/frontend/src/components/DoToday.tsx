import type { Task, Child } from '../types'

interface DoTodayProps {
  tasks: Task[]
  children: Child[]
  onTaskToggle: (taskId: string, completed: boolean) => void
}

const subjectColors: Record<string, string> = {
  QURAN: 'bg-purple-100 text-purple-800',
  ARABIC: 'bg-blue-100 text-blue-800',
  MATH: 'bg-orange-100 text-orange-800',
  READING: 'bg-green-100 text-green-800',
  SCIENCE: 'bg-indigo-100 text-indigo-800',
  'ISLAMIC STUDIES': 'bg-pink-100 text-pink-800',
  ENGLISH: 'bg-cyan-100 text-cyan-800',
  HISTORY: 'bg-amber-100 text-amber-800',
}

const statusBadgeMap: Record<string, string> = {
  Ready: 'badge-blue',
  Overdue: 'badge-red',
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
      <div key={label} className="card-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{label}</h3>
          <span className="text-sm text-gray-600">{completed} of {total}</span>
        </div>

        <div className="mb-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="space-y-1">
          {childTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 py-2 px-2 rounded hover:bg-gray-50">
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onTaskToggle(task.id, !task.completed)}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 cursor-pointer"
                />
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`badge text-xs font-medium ${subjectColors[task.subject] || 'bg-gray-100 text-gray-800'}`}>
                    {task.subject}
                  </span>
                  <span className={`badge text-xs ${statusBadgeMap[task.status] || 'badge-gray'}`}>
                    {task.status}
                  </span>
                </div>
                <p className={task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                  {task.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
          <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 transition">
            Log Quran
          </button>
          <button className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg font-medium text-sm hover:bg-green-100 transition">
            Add Evidence
          </button>
          <button className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-100 transition">
            Move Work
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Do Today</h2>

      {familyTasks.length > 0 && renderTaskGroup('🏠 Family', familyTasks)}

      {children.map((child) =>
        renderTaskGroup(
          `${child.avatar} ${child.name} (Grade ${child.grade})`,
          groupedTasks[child.id] || []
        )
      )}
    </section>
  )
}
