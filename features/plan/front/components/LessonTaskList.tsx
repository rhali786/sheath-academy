'use client'

import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import { LessonCard } from './LessonCard'

interface LessonTaskListProps {
  lessons: LessonTask[]
  children: StudentProfile[]
  subjects: SubjectCourse[]
  error?: string | null
  onEdit?: (lesson: LessonTask) => void
  onDelete?: (id: string) => void
}

export function LessonTaskList({ lessons, children, subjects, error, onEdit, onDelete }: LessonTaskListProps) {
  if (error) {
    return <p className="text-sm text-red-600 py-4">Could not load lessons. Please refresh.</p>
  }

  if (lessons.length === 0) {
    return <p className="text-sm text-slate-500 py-4">No lessons yet. Add your first one above.</p>
  }

  function resolveChildName(childId: string): string {
    return children.find(c => c.id === childId)?.name ?? childId
  }

  function resolveSubjectName(subjectId: string): string {
    return subjects.find(s => s.id === subjectId)?.name ?? subjectId
  }

  return (
    <div className="space-y-3">
      {lessons.map(lesson => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          childName={resolveChildName(lesson.childId)}
          subjectName={resolveSubjectName(lesson.subjectId)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
