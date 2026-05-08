import { CheckCircle2, Circle } from 'lucide-react'
import type { Task } from '../../types'

interface TaskCheckboxProps {
  task: Task
  onCheck: (taskId: string, completed: boolean) => void
}

export function TaskCheckbox({ task, onCheck }: TaskCheckboxProps) {
  return (
    <div
      className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded px-2 transition"
      onClick={() => onCheck(task.id, !task.completed)}
    >
      <div className="flex-shrink-0">
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>
      <div className="flex-grow">
        <p className={task.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
          {task.description}
        </p>
      </div>
    </div>
  )
}
