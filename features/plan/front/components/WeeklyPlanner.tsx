'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { usePlanner } from '../context/PlannerContext'
import { useHousehold } from '@/features/household/front/context'
import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import { lessonSpansDate } from '@/features/plan/utils/lessonCompletionWindow'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'
import { useLessonReschedule } from './WeekGrid'
import { DisplayModeToggle, type PlannerDisplayMode } from './PlannerViewToggle'

const STATUS_BADGE: Record<LessonTaskStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  completed:   'bg-green-100 text-green-700',
  skipped:     'bg-amber-100 text-amber-700',
}
const STATUS_LABEL: Record<LessonTaskStatus, string> = {
  not_started: 'Not started',
  completed:   'Completed',
  skipped:     'Skipped',
}

const DURATION_LABEL: Record<string, string> = {
  '15min': '15 min',
  '30min': '30 min',
  '45min': '45 min',
  '1hr':   '1 hr',
  custom:  'Custom',
}

// Deterministic per-learner accent color for the "learner spine" rail. StudentProfile does not
// yet carry a stored displayColor (only the children/schema layer has it — out of this phase's
// file scope), so we derive a stable index from the learner id instead of positional order.
const LEARNER_SPINE_COLORS = ['#1a5c3a', '#0284c7', '#b45309', '#7c3aed', '#be123c', '#0f766e']

function learnerColor(learnerId: string): string {
  let hash = 0
  for (let i = 0; i < learnerId.length; i++) {
    hash = (hash * 31 + learnerId.charCodeAt(i)) >>> 0
  }
  return LEARNER_SPINE_COLORS[hash % LEARNER_SPINE_COLORS.length]
}

function learnerInitial(learner: StudentProfile): string {
  if (learner.avatarInitials) return learner.avatarInitials
  return learner.name.trim().charAt(0).toUpperCase() || '?'
}

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

function normalizeDateOnly(date: Date): Date {
  const dateStr = date.toISOString().slice(0, 10)
  return new Date(`${dateStr}T00:00:00`)
}

interface DaySection {
  dateStr: string
  date: Date
  dayLabel: string
  isWeekend: boolean
}

interface LearnerBadge {
  initial: string
  color: string
  name: string
}

interface LessonCardProps {
  lesson: LessonTask
  onEdit: (id: string) => void
  resolveSubjectName: (subjectId: string) => string
  learnerBadge?: LearnerBadge
}

/**
 * Draggable lesson card. Shared by both display modes ("By learner" and "By day") so the
 * drag-to-reschedule affordance and mutation contract are identical in both — only the
 * optional `learnerBadge` (shown in "By day" mode, where multiple learners share a column)
 * differs between call sites.
 */
function LessonCard({ lesson, onEdit, resolveSubjectName, learnerBadge }: LessonCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lesson.id,
    data: { lesson },
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: 0 as const }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-lesson-card
      data-testid={`lesson-card-${lesson.id}`}
      onClick={() => onEdit(lesson.id)}
      className={`p-3 bg-white rounded-lg border border-forest-200 hover:shadow-md transition-shadow cursor-pointer ${isDragging ? 'opacity-0' : ''}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="text-xs font-medium text-forest-700 uppercase tracking-wide pointer-events-none">
          {resolveSubjectName(lesson.subjectId)}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {learnerBadge && (
            <span
              data-testid={`combined-learner-badge-${lesson.id}`}
              aria-label={learnerBadge.name}
              title={learnerBadge.name}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-semibold text-white pointer-events-none"
              style={{ backgroundColor: learnerBadge.color }}
            >
              {learnerBadge.initial}
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
      {lesson.chapter ? (
        <>
          <div className="font-semibold text-forest-900 text-sm mt-0.5">{lesson.chapter}</div>
          {lesson.curriculum && (
            <div className="text-xs text-slate-500">{lesson.curriculum}</div>
          )}
        </>
      ) : (
        <div className="font-semibold text-forest-900 text-sm mt-0.5">{lesson.title}</div>
      )}
      <div className="mt-2 flex items-center flex-wrap gap-2">
        <span
          data-testid="status-badge"
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[lesson.status]}`}
        >
          {STATUS_LABEL[lesson.status]}
        </span>
        {lesson.resourceLink && (
          <span
            data-testid="resource-indicator"
            aria-label="Has resource link"
            title="Has resource link"
            className="text-xs text-slate-500"
          >
            📎
          </span>
        )}
        {lesson.hasHomework && (
          <span
            data-testid="homework-indicator"
            aria-label="Has homework"
            title="Has homework"
            className="text-xs text-slate-500"
          >
            📝
          </span>
        )}
        {lesson.hasAssessment && (
          <span
            data-testid="assessment-indicator"
            aria-label="Has assessment"
            title="Has assessment"
            className="text-xs text-slate-500"
          >
            📋
          </span>
        )}
        {lesson.estimatedDuration && (
          <span className="text-xs text-slate-400">
            {DURATION_LABEL[lesson.estimatedDuration] ?? lesson.estimatedDuration}
          </span>
        )}
      </div>
    </div>
  )
}

interface DroppableDaySlotProps {
  id: string
  dateStr: string
  children: React.ReactNode
}

/** Droppable day column. `id` shapes the drop target so handleDragEnd only ever needs `dateStr`
 * (the same contract WeekGrid's droppable cells use) — see useLessonReschedule in WeekGrid.tsx. */
function DroppableDaySlot({ id, dateStr, children }: DroppableDaySlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { dateStr } })
  return (
    <div ref={setNodeRef} className={`rounded-md transition-colors ${isOver ? 'bg-forest-50 ring-2 ring-forest-200' : ''}`}>
      {children}
    </div>
  )
}

export function WeeklyPlanner() {
  const { lessons, selectedWeek, weekStartDay, children, subjects, selectedChildIds, selectedSubjectIds, refreshLessons } = usePlanner()
  const { householdProfile } = useHousehold()
  const schoolDays = householdProfile?.schoolDays
  const router = useRouter()
  const [collapsedLearnerIds, setCollapsedLearnerIds] = useState<Set<string>>(new Set())
  const [displayMode, setDisplayMode] = useState<PlannerDisplayMode>('byLearner')

  const { activeLesson, undoNotice, setUndoNotice, handleDragStart, handleDragEnd, handleUndo } =
    useLessonReschedule(lessons, schoolDays, refreshLessons)

  const d = normalizeDateOnly(selectedWeek)
  const dayOfWeek = d.getDay()
  const daysFromMonday = weekStartDay === 'Monday'
    ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    : dayOfWeek
  d.setDate(d.getDate() - daysFromMonday)
  const weekStart = new Date(d)

  const orderedDays = Array.from({ length: 7 }, (_, i) =>
    new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
  )

  const daySections: DaySection[] = orderedDays.map(date => {
    const dow = date.getDay()
    return {
      dateStr: formatLocalDate(date),
      date,
      dayLabel: getDayOfWeekLabel(dow),
      isWeekend: isWeekend(dow),
    }
  })

  const learners = children.filter(c => selectedChildIds.includes(c.id))

  function toggleLearner(id: string) {
    setCollapsedLearnerIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function resolveSubjectName(subjectId: string): string {
    return subjects.find(s => s.id === subjectId)?.name ?? subjectId
  }

  function lessonsForLearner(learnerId: string): LessonTask[] {
    return lessons.filter(l => l.childId === learnerId && selectedSubjectIds.includes(l.subjectId))
  }

  function lessonsForLearnerDay(learnerId: string, dateStr: string): LessonTask[] {
    return lessons.filter(
      l => l.childId === learnerId && selectedSubjectIds.includes(l.subjectId) && lessonSpansDate(l, dateStr),
    )
  }

  function handleEdit(lessonId: string) {
    router.push(`/lessons?editId=${lessonId}`)
  }

  return (
    <div className="space-y-4">
      {undoNotice && (
        <InlineSuccess
          message={`Moved "${undoNotice.lessonTitle}" to ${undoNotice.newDueDateLabel}${undoNotice.isOffDayTarget ? ' (an off day)' : ''}`}
          action={{ label: 'Undo', onAction: handleUndo }}
          onDismiss={() => setUndoNotice(null)}
        />
      )}

      <div className="flex justify-end">
        <DisplayModeToggle mode={displayMode} onChange={setDisplayMode} />
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {displayMode === 'byDay' ? (
          <div data-testid="planner-combined-view" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {daySections.map(day => {
              const entries = learners.flatMap(learner =>
                lessonsForLearnerDay(learner.id, day.dateStr).map(lesson => ({ lesson, learner })),
              )

              return (
                <DroppableDaySlot key={day.dateStr} id={`all:${day.dateStr}`} dateStr={day.dateStr}>
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5 px-1 pt-1">{day.dayLabel}</div>
                  {entries.length === 0 ? (
                    <div
                      data-testid={`combined-day-empty-${day.dateStr}`}
                      className="text-xs text-slate-400 py-1 px-1 opacity-60"
                    >
                      —
                    </div>
                  ) : (
                    <div data-testid={`combined-day-lessons-${day.dateStr}`} className="space-y-2 px-1 pb-1">
                      {entries.map(({ lesson, learner }) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          onEdit={handleEdit}
                          resolveSubjectName={resolveSubjectName}
                          learnerBadge={{
                            initial: learnerInitial(learner),
                            color: learnerColor(learner.id),
                            name: learner.name,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </DroppableDaySlot>
              )
            })}
          </div>
        ) : (
          learners.map(learner => {
            const isCollapsed = collapsedLearnerIds.has(learner.id)
            const color = learnerColor(learner.id)
            const learnerLessons = lessonsForLearner(learner.id)

            return (
              <div
                key={learner.id}
                data-learner-section
                className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
                style={{ borderLeftWidth: 4, borderLeftColor: color }}
              >
                <button
                  type="button"
                  onClick={() => toggleLearner(learner.id)}
                  aria-expanded={!isCollapsed}
                  aria-label={learner.name}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    >
                      {learnerInitial(learner)}
                    </span>
                    <span className="font-semibold text-slate-900">{learner.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCollapsed && (
                      <span className="text-xs text-slate-500">
                        {learnerLessons.length} {learnerLessons.length === 1 ? 'lesson' : 'lessons'} this week
                      </span>
                    )}
                    <span className={`text-lg text-slate-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  learnerLessons.length === 0 ? (
                    <div className="px-4 pb-4 text-sm text-slate-500 border-t border-slate-100 pt-3">
                      No lessons this week
                    </div>
                  ) : (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                      {daySections.map(day => {
                        const dayLessons = lessonsForLearnerDay(learner.id, day.dateStr)

                        return (
                          <DroppableDaySlot key={day.dateStr} id={`${learner.id}:${day.dateStr}`} dateStr={day.dateStr}>
                            <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5 px-1 pt-1">{day.dayLabel}</div>
                            {dayLessons.length === 0 ? (
                              <div
                                data-testid={`day-empty-${learner.id}-${day.dateStr}`}
                                className="text-xs text-slate-400 py-1 px-1"
                              >
                                <div className="mt-1 opacity-60">—</div>
                              </div>
                            ) : (
                              <div data-testid={`day-lessons-${learner.id}-${day.dateStr}`} className="space-y-2 px-1 pb-1">
                                {dayLessons.map(lesson => (
                                  <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onEdit={handleEdit}
                                    resolveSubjectName={resolveSubjectName}
                                  />
                                ))}
                              </div>
                            )}
                          </DroppableDaySlot>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            )
          })
        )}

        <DragOverlay>
          {activeLesson && (
            <div className="p-3 bg-white rounded-lg border border-forest-200 shadow-lg opacity-90">
              <div className="font-semibold text-forest-900 text-sm">{activeLesson.chapter || activeLesson.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
