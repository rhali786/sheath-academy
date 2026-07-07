'use client'

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { usePlanner } from '../context/PlannerContext'
import { plannerApi } from '../services/api'
import type { LessonTask, LessonTaskStatus, LessonDuration } from '../../types'
import { subjectEnrollsLearner } from '@/features/subjects/lib/enrollment'
import { formatCompletionWindow, lessonSpansDate } from '../../utils/lessonCompletionWindow'
import { shiftLessonWindow } from '../../server/validation'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'

const STATUS_BADGE: Record<LessonTaskStatus, string | null> = {
  not_started: null,
  completed:   'bg-green-100 text-green-700',
  skipped:     'bg-amber-100 text-amber-700',
}
const STATUS_LABEL: Record<LessonTaskStatus, string> = {
  not_started: '',
  completed:   'Done',
  skipped:     'Skipped',
}

function getDayOfWeekLabel(dayIndex: number): string {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return labels[dayIndex]
}

function isWeekend(dayIndex: number): boolean {
  return dayIndex === 0 || dayIndex === 6
}

const DURATION_MINUTES: Record<LessonDuration, number> = {
  '15min': 15,
  '30min': 30,
  '45min': 45,
  '1hr': 60,
  'custom': 0,
}

const DURATION_LABEL: Record<LessonDuration, string> = {
  '15min': '15 min',
  '30min': '30 min',
  '45min': '45 min',
  '1hr': '1 hr',
  'custom': 'custom',
}

function formatTotalMinutes(mins: number): string {
  if (mins === 0) return ''
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

interface DraggableLessonProps {
  lesson: LessonTask
  onEdit: (id: string) => void
}

function DraggableLesson({ lesson, onEdit }: DraggableLessonProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lesson.id,
    data: { lesson },
  })
  const windowLabel = formatCompletionWindow(lesson)

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: 0 as const }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onEdit(lesson.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit(lesson.id)
        }
      }}
      className={`p-2.5 rounded-md border hover:shadow-md transition-shadow cursor-pointer select-none ${isDragging ? 'opacity-0' : ''} ${lesson.status === 'completed' ? 'bg-green-50 border-green-200' : lesson.status === 'skipped' ? 'bg-amber-50 border-amber-200' : 'bg-forest-50 border-forest-200'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className={`font-medium text-sm pointer-events-none ${lesson.status === 'completed' ? 'line-through text-slate-400' : 'text-forest-900'}`}>{lesson.title}</div>
        <div className="flex items-center gap-1 shrink-0">
          {STATUS_BADGE[lesson.status] && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full pointer-events-none ${STATUS_BADGE[lesson.status]}`}>
              {STATUS_LABEL[lesson.status]}
            </span>
          )}
          <button
            type="button"
            aria-label="Drag to reschedule"
            title="Drag to reschedule"
            className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-0.5"
            onClick={(e) => e.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {lesson.description && <div className="text-xs text-forest-700 mt-1 pointer-events-none">{lesson.description}</div>}
      {windowLabel && (
        <div className="text-xs text-forest-600 mt-1 pointer-events-none">{windowLabel}</div>
      )}
      {lesson.estimatedDuration && (
        <div className="text-xs text-slate-400 mt-1 pointer-events-none">{DURATION_LABEL[lesson.estimatedDuration]}</div>
      )}
    </div>
  )
}

interface DroppableCellProps {
  id: string
  dateStr: string
  isWeekendDay: boolean
  lesson: LessonTask | undefined
  onEdit: (id: string) => void
}

function DroppableCell({ id, dateStr, isWeekendDay, lesson, onEdit }: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { dateStr } })

  return (
    <td
      ref={setNodeRef}
      className={`px-3 py-3 text-sm align-top border-l border-slate-200 transition-colors ${
        isWeekendDay
          ? 'bg-slate-50 text-slate-600 opacity-60'
          : isOver
          ? 'bg-forest-100'
          : 'bg-white'
      }`}
    >
      {lesson && <DraggableLesson lesson={lesson} onEdit={onEdit} />}
    </td>
  )
}

interface RescheduleUndo {
  lessonTitle: string
  newDueDateLabel: string
  prevDueDate: string
  prevPlannedStartDate: string | null
  lessonId: string
}

export function WeekGrid() {
  const { lessons, selectedWeek, weekStartDay, children, subjects, selectedChildIds, selectedSubjectIds, refreshLessons } = usePlanner()
  const router = useRouter()
  const [activeLesson, setActiveLesson] = useState<LessonTask | null>(null)
  const [undoNotice, setUndoNotice] = useState<RescheduleUndo | null>(null)

  const todayStr = formatLocalDate(new Date())

  const d = new Date(selectedWeek)
  const dayOfWeek = d.getDay()
  const daysFromStart = weekStartDay === 'Monday' ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1) : dayOfWeek
  d.setDate(d.getDate() - daysFromStart)
  const weekStart = new Date(d)

  const orderedDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
    return date
  })

  const rows = children
    .filter(child => selectedChildIds.includes(child.id))
    .flatMap(child =>
      subjects
        .filter(
          (subject) =>
            selectedSubjectIds.includes(subject.id) && subjectEnrollsLearner(subject, child.id),
        )
        .map(subject => ({ childId: child.id, childName: child.name, subjectId: subject.id, subjectName: subject.name }))
    )

  function getDayTotalMinutes(dateStr: string): number {
    return lessons
      .filter(l => l.dueDate === dateStr && l.estimatedDuration)
      .reduce((sum, l) => sum + (DURATION_MINUTES[l.estimatedDuration!] ?? 0), 0)
  }

  function getLessonForCell(dateStr: string, childId: string, subjectId: string) {
    return lessons.find(
      l => l.childId === childId && l.subjectId === subjectId && lessonSpansDate(l, dateStr),
    )
  }

  function handleEdit(lessonId: string) {
    router.push(`/lessons?editId=${lessonId}`)
  }

  function handleDragStart(event: DragStartEvent) {
    const lesson = lessons.find(l => l.id === (event.active.id as string))
    setActiveLesson(lesson ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveLesson(null)
    const { active, over } = event
    if (!over) return
    const lessonId = active.id as string
    const newDueDateStr = over.data.current?.dateStr as string | undefined
    if (!newDueDateStr) return
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson || lesson.dueDate === newDueDateStr) return

    const prevDueDate = lesson.dueDate
    const prevPlannedStartDate = lesson.plannedStartDate ?? null

    const { plannedStartDate: newPlannedStart, dueDate: newDueDate } = shiftLessonWindow(
      prevPlannedStartDate,
      prevDueDate,
      newDueDateStr,
    )

    const patch: Partial<LessonTask> = { dueDate: newDueDate }
    if (newPlannedStart !== null) patch.plannedStartDate = newPlannedStart

    await plannerApi.updateLesson(lessonId, patch)
    refreshLessons?.()

    const dayLabel = new Date(`${newDueDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
    setUndoNotice({
      lessonTitle: lesson.title,
      newDueDateLabel: dayLabel,
      prevDueDate,
      prevPlannedStartDate,
      lessonId,
    })
  }

  async function handleUndo() {
    if (!undoNotice) return
    const undoPatch: Partial<LessonTask> = { dueDate: undoNotice.prevDueDate }
    if (undoNotice.prevPlannedStartDate !== null) undoPatch.plannedStartDate = undoNotice.prevPlannedStartDate
    await plannerApi.updateLesson(undoNotice.lessonId, undoPatch)
    refreshLessons?.()
    setUndoNotice(null)
  }

  return (
    <>
    {undoNotice && (
      <div className="mb-3">
        <InlineSuccess
          message={`Moved "${undoNotice.lessonTitle}" to ${undoNotice.newDueDateLabel}`}
          action={{ label: 'Undo', onAction: handleUndo }}
          onDismiss={() => setUndoNotice(null)}
        />
      </div>
    )}
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                const dateStr = formatLocalDate(date)
                const isToday = dateStr === todayStr
                const displayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const dayLabel = getDayOfWeekLabel(dow)

                return (
                  <th
                    key={dateStr}
                    className={`px-3 py-3 text-sm font-semibold text-center min-w-32 border-l border-slate-200 ${
                      isWeekendDay
                        ? 'bg-slate-50 text-slate-400 opacity-60'
                        : isToday
                        ? 'bg-forest-100 ring-2 ring-inset ring-forest-500'
                        : 'bg-forest-50'
                    }`}
                  >
                    <div className={isWeekendDay ? 'text-slate-500' : isToday ? 'text-forest-800 font-bold' : 'text-forest-900'}>{dayLabel}</div>
                    <div className={`text-xs ${isWeekendDay ? 'text-slate-400' : isToday ? 'text-forest-600 font-semibold' : 'text-forest-700'}`}>{displayStr}</div>
                    {isToday && <div className="text-xs text-forest-600 font-medium">Today</div>}
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
                  const cellId = `${row.childId}:${row.subjectId}:${dateStr}`

                  return (
                    <DroppableCell
                      key={dateStr}
                      id={cellId}
                      dateStr={dateStr}
                      isWeekendDay={isWeekendDay}
                      lesson={lesson}
                      onEdit={handleEdit}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td className="px-4 py-2 text-xs text-slate-400 font-medium">Daily total</td>
              {orderedDays.map(date => {
                const dateStr = formatLocalDate(date)
                const total = getDayTotalMinutes(dateStr)
                const totalStr = formatTotalMinutes(total)
                return (
                  <td key={dateStr} className="px-3 py-2 text-center border-l border-slate-200">
                    {totalStr && <span className="text-xs text-slate-500 font-medium">{totalStr}</span>}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      <DragOverlay>
        {activeLesson && (
          <div className="p-2.5 bg-forest-50 rounded-md border border-forest-200 shadow-lg opacity-90">
            <div className="font-medium text-forest-900">{activeLesson.title}</div>
            {activeLesson.description && <div className="text-xs text-forest-700 mt-1">{activeLesson.description}</div>}
          </div>
        )}
      </DragOverlay>
    </DndContext>
    </>
  )
}
