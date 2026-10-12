'use client'

import { useEffect, useState } from 'react'
import type { LessonTask, LessonTaskStatus, LessonDuration } from '@/features/plan/types'
import type { StudentProfile, DayOfWeek } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'
import {
  filterSubjectsForLearners,
  subjectEnrollsLearner,
} from '@/features/subjects/lib/enrollment'
import { isOffDay } from '@/features/plan/utils/schoolDays'
import { LessonTimeFields, validateLessonTimes } from '@/features/plan/front/components/LessonTimeFields'
import { GroupEditOptions } from '@/features/plan/front/components/GroupEditOptions'
import { describeLessonTime } from '@/features/schedule/lib/courseTimes'
import { Trash2 } from 'lucide-react'

const GENERAL_LESSON_TYPES = ['Lesson', 'Assignment', 'Reading', 'Practice', 'Review', 'Project', 'Assessment', 'Other']
const QURAN_LESSON_TYPES   = ['Memorisation', 'Revision', 'Recitation', 'Tajweed', 'Listening']

const DURATION_OPTIONS: { value: LessonDuration; label: string }[] = [
  { value: '15min', label: '15 minutes' },
  { value: '30min', label: '30 minutes' },
  { value: '45min', label: '45 minutes' },
  { value: '1hr',   label: '1 hour' },
  { value: 'custom', label: 'Custom' },
]

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export interface LessonLearnerAssignment {
  childId: string
  subjectId: string
}

function resolveAssignments(
  selectedChildIds: string[],
  subjectId: string,
  allSubjects: SubjectCourse[],
): LessonLearnerAssignment[] {
  const template = allSubjects.find(s => s.id === subjectId)
  return selectedChildIds.map(childId => {
    if (template && subjectEnrollsLearner(template, childId)) {
      return { childId, subjectId: template.id }
    }
    const match = template
      ? allSubjects.find(
          (s) => s.name === template.name && subjectEnrollsLearner(s, childId),
        )
      : allSubjects.find((s) => s.id === subjectId && subjectEnrollsLearner(s, childId))
    return { childId, subjectId: match?.id ?? subjectId }
  })
}

export interface LessonFormData {
  childId: string
  childIds?: string[]
  assignments?: LessonLearnerAssignment[]
  subjectId: string
  title: string
  description?: string
  resourceLink?: string
  /** `null` (edit only) clears "Available from". */
  plannedStartDate?: string | null
  dueDate: string
  status: LessonTaskStatus
  order: number
  estimatedDuration?: LessonDuration
  /** `null` (edit only) clears the lesson's own time so it falls back to its course time. */
  scheduledStartTime?: string | null
  scheduledEndTime?: string | null
  lessonType?: string
  /** Edit of a shared lesson: title and details go to every learner's copy. */
  applyToGroup?: boolean
  /** With applyToGroup: also move date/time for every learner. */
  applyScheduleToGroup?: boolean
  curriculum?: string
  chapter?: string
  hasHomework?: boolean
  hasAssessment?: boolean
}

interface LessonTaskFormProps {
  children: StudentProfile[]
  subjects: SubjectCourse[]
  editingLesson?: LessonTask
  defaultSelectedChildIds?: string[]
  /** Household's configured school days (from `useHousehold().householdProfile.schoolDays`); undefined = Mon–Fri default. */
  schoolDays?: DayOfWeek[]
  onSubmit: (data: LessonFormData) => Promise<void>
  onCancel?: () => void
  /** Edit mode: shows a Delete button (the caller confirms and deletes). */
  onDelete?: () => void
  /** Focus the title when the form appears (the Edit lesson window). */
  autoFocusTitle?: boolean
}

function dateStrDayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getDay()
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Monday of the school week containing dateStr. */
function mondayOfSchoolWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const dayOfWeek = d.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setDate(d.getDate() - daysFromMonday)
  return toDateStr(d)
}

/** Friday of the school week containing dateStr. */
function fridayOfSchoolWeek(dateStr: string): string {
  const monday = new Date(`${mondayOfSchoolWeek(dateStr)}T00:00:00`)
  monday.setDate(monday.getDate() + 4)
  return toDateStr(monday)
}

export function LessonTaskForm({
  children,
  subjects,
  editingLesson,
  defaultSelectedChildIds,
  schoolDays,
  onSubmit,
  onCancel,
  onDelete,
  autoFocusTitle = false,
}: LessonTaskFormProps) {
  const isEdit = Boolean(editingLesson)

  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(
    editingLesson ? [editingLesson.childId] : (defaultSelectedChildIds ?? []),
  )
  const childId = selectedChildIds[0] ?? ''
  const [subjectId, setSubjectId] = useState(editingLesson?.subjectId ?? '')
  const [title, setTitle] = useState(editingLesson?.title ?? '')
  const [description, setDescription] = useState(editingLesson?.description ?? '')
  const [resourceLink, setResourceLink] = useState(editingLesson?.resourceLink ?? '')
  const [plannedStartDate, setPlannedStartDate] = useState(editingLesson?.plannedStartDate ?? '')
  const [dueDate, setDueDate] = useState(editingLesson?.dueDate ?? todayLocal())
  const [status, setStatus] = useState<LessonTaskStatus>(editingLesson?.status ?? 'not_started')
  const [estimatedDuration, setEstimatedDuration] = useState<LessonDuration | ''>(editingLesson?.estimatedDuration ?? '')
  const [scheduledStartTime, setScheduledStartTime] = useState(editingLesson?.scheduledStartTime ?? '')
  const [scheduledEndTime, setScheduledEndTime] = useState(editingLesson?.scheduledEndTime ?? '')
  const [lessonType, setLessonType] = useState(editingLesson?.lessonType ?? '')
  const [curriculum, setCurriculum] = useState(editingLesson?.curriculum ?? '')
  const [chapter, setChapter] = useState(editingLesson?.chapter ?? '')
  const [hasHomework, setHasHomework] = useState(editingLesson?.hasHomework ?? false)
  const [hasAssessment, setHasAssessment] = useState(editingLesson?.hasAssessment ?? false)
  const [titleError, setTitleError] = useState('')
  const [timeError, setTimeError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courseError, setCourseError] = useState('')
  // Shared lesson (edit only): details follow the group by default, date/time do not.
  const [applyToGroup, setApplyToGroup] = useState(true)
  const [applyScheduleToGroup, setApplyScheduleToGroup] = useState(false)
  const [offDayWarningDismissed, setOffDayWarningDismissed] = useState(false)

  // Reset subject when selected learners change (except on initial load in edit mode)
  const [prevChildKey, setPrevChildKey] = useState(selectedChildIds.join(','))
  useEffect(() => {
    const key = selectedChildIds.join(',')
    if (key !== prevChildKey) {
      setSubjectId('')
      setPrevChildKey(key)
    }
  }, [selectedChildIds, prevChildKey])

  const dueDateIsOffDay = Boolean(dueDate) && isOffDay(dateStrDayOfWeek(dueDate), schoolDays)
  const plannedStartIsOffDay = Boolean(plannedStartDate) && isOffDay(dateStrDayOfWeek(plannedStartDate), schoolDays)
  const showOffDayWarning = !offDayWarningDismissed && (dueDateIsOffDay || plannedStartIsOffDay)

  useEffect(() => {
    setOffDayWarningDismissed(false)
  }, [dueDate, plannedStartDate])

  function applyThisWeekSpan() {
    const base = dueDate || todayLocal()
    setPlannedStartDate(mondayOfSchoolWeek(base))
    setDueDate(fridayOfSchoolWeek(base))
  }

  function toggleChild(id: string) {
    setSelectedChildIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    )
  }

  const filteredSubjects = isEdit
    ? filterSubjectsForLearners(subjects, [childId])
    : filterSubjectsForLearners(subjects, selectedChildIds)
  const selectedSubject = filteredSubjects.find(s => s.id === subjectId)
  const lessonTypes = selectedSubject?.category === 'Quran' ? QURAN_LESSON_TYPES : GENERAL_LESSON_TYPES
  const timeHint = selectedSubject
    ? describeLessonTime({ courseName: selectedSubject.name, blocks: selectedSubject.recurringSchedule, date: dueDate, ownStart: scheduledStartTime, ownEnd: scheduledEndTime })
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTitleError('')
    setTimeError('')

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('Title is required')
      return
    }
    if (trimmedTitle.length > 120) {
      setTitleError('Title must be 120 characters or fewer')
      return
    }
    if (selectedChildIds.length === 0) {
      setTitleError('Select at least one learner')
      return
    }
    // Edit: switching learner clears the course; the new learner needs one of their own.
    if (isEdit && !subjectId) {
      const name = children.find(c => c.id === childId)?.name ?? 'this learner'
      setCourseError(`Choose a course for ${name}`)
      return
    }
    setCourseError('')

    const trimmedStartTime = scheduledStartTime.trim()
    const trimmedEndTime = scheduledEndTime.trim()
    const timeProblem = validateLessonTimes(trimmedStartTime, trimmedEndTime)
    if (timeProblem) {
      setTimeError(timeProblem)
      return
    }
    // On edit, blank must reach the server as null — `undefined` is dropped from the
    // JSON body and the route would keep the old time / "Available from" date.
    const clearedTime = isEdit ? null : undefined

    setIsSubmitting(true)
    try {
      const assignments = resolveAssignments(selectedChildIds, subjectId, subjects)
      await onSubmit({
        childId: selectedChildIds[0],
        childIds: selectedChildIds.length > 1 ? selectedChildIds : undefined,
        assignments: selectedChildIds.length > 1 ? assignments : undefined,
        subjectId,
        title: trimmedTitle,
        // Edit sends '' / false so a cleared field or unticked box is saved; undefined is
        // dropped from the request body and the server would keep the old value.
        description: isEdit ? description.trim() : (description.trim() || undefined),
        resourceLink: isEdit ? resourceLink.trim() : (resourceLink.trim() || undefined),
        plannedStartDate: plannedStartDate.trim() || clearedTime,
        dueDate,
        status,
        order: editingLesson?.order ?? 0,
        estimatedDuration: estimatedDuration || undefined,
        scheduledStartTime: trimmedStartTime || clearedTime,
        scheduledEndTime: trimmedEndTime || clearedTime,
        lessonType: lessonType || undefined,
        curriculum: isEdit ? curriculum.trim() : (curriculum.trim() || undefined),
        chapter: isEdit ? chapter.trim() : (chapter.trim() || undefined),
        hasHomework: isEdit ? hasHomework : (hasHomework || undefined),
        hasAssessment: isEdit ? hasAssessment : (hasAssessment || undefined),
        ...(editingLesson?.groupId && applyToGroup ? { applyToGroup: true } : {}),
        ...(editingLesson?.groupId && applyToGroup && applyScheduleToGroup ? { applyScheduleToGroup: true } : {}),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1">
            Learner(s)
          </span>
          {isEdit ? (
            <select
              id="learnerId"
              aria-label="Learner"
              value={childId}
              onChange={e => { setSelectedChildIds([e.target.value]); setCourseError('') }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-2 rounded-lg border border-slate-200 px-3 py-2">
              {children.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedChildIds.includes(c.id)}
                    onChange={() => toggleChild(c.id)}
                    aria-label={c.name}
                    className="rounded border-slate-300 text-forest-900 focus:ring-forest-500"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="subjectId" className="block text-sm font-medium text-slate-700 mb-1">
            Course
          </label>
          <select
            id="subjectId"
            value={subjectId}
            onChange={e => { setSubjectId(e.target.value); setLessonType(''); setCourseError('') }}
            disabled={selectedChildIds.length === 0}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:opacity-50"
          >
            <option value="">{selectedChildIds.length === 0 ? 'Choose a learner first to see active courses.' : 'Select course'}</option>
            {filteredSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {courseError && <p className="text-xs text-red-600 mt-1">{courseError}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          autoFocus={autoFocusTitle}
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
        {titleError && <p className="text-xs text-red-600 mt-1">{titleError}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="plannedStartDate" className="block text-sm font-medium text-slate-700 mb-1">
            Available from <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="plannedStartDate"
            type="date"
            value={plannedStartDate}
            onChange={e => setPlannedStartDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
      </div>
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Setting both dates makes this lesson span multiple days — it will appear every day from &lsquo;Available from&rsquo; through &lsquo;Due date&rsquo;, for example Monday through Friday for a lesson that runs all week.
        </p>
        <button
          type="button"
          onClick={applyThisWeekSpan}
          className="text-xs font-medium text-forest-700 hover:text-forest-900 underline underline-offset-2 whitespace-nowrap"
        >
          This week (Mon–Fri)
        </button>
      </div>
      {showOffDayWarning && (
        <div role="status" className="flex items-start justify-between gap-2 -mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>
            This date is marked as an off day in your household settings.
          </span>
          <button
            type="button"
            aria-label="Dismiss off-day warning"
            onClick={() => setOffDayWarningDismissed(true)}
            className="text-amber-600 hover:text-amber-800 shrink-0"
          >
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value as LessonTaskStatus)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value="not_started">Not started</option>
            <option value="completed">Completed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estimatedDuration" className="block text-sm font-medium text-slate-700 mb-1">
            Estimated duration <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            id="estimatedDuration"
            value={estimatedDuration}
            onChange={e => setEstimatedDuration(e.target.value as LessonDuration | '')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value="">Select duration</option>
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lessonType" className="block text-sm font-medium text-slate-700 mb-1">
            Lesson type <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            id="lessonType"
            value={lessonType}
            onChange={e => setLessonType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          >
            <option value="">Select type</option>
            {lessonTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <LessonTimeFields
        idPrefix={isEdit ? `lesson-form-${editingLesson!.id}` : 'lesson-form-new'}
        start={scheduledStartTime}
        end={scheduledEndTime}
        onStartChange={setScheduledStartTime}
        onEndChange={setScheduledEndTime}
        error={timeError}
        hint={timeHint}
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
        />
      </div>

      <div>
        <label htmlFor="resourceLink" className="block text-sm font-medium text-slate-700 mb-1">
          Resource link <span className="text-slate-400 font-normal">(optional, https://…)</span>
        </label>
        <input
          id="resourceLink"
          type="url"
          value={resourceLink}
          onChange={e => setResourceLink(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="curriculum" className="block text-sm font-medium text-slate-700 mb-1">
            Curriculum <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="curriculum"
            type="text"
            value={curriculum}
            onChange={e => setCurriculum(e.target.value)}
            placeholder="e.g. All About Reading Level 2"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div>
          <label htmlFor="chapter" className="block text-sm font-medium text-slate-700 mb-1">
            Chapter <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="chapter"
            type="text"
            value={chapter}
            onChange={e => setChapter(e.target.value)}
            placeholder="e.g. Chapter 91"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={hasHomework}
            onChange={e => setHasHomework(e.target.checked)}
            aria-label="Has homework"
            className="rounded border-slate-300 text-forest-900 focus:ring-forest-500"
          />
          Has homework
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAssessment}
            onChange={e => setHasAssessment(e.target.checked)}
            aria-label="Has assessment"
            className="rounded border-slate-300 text-forest-900 focus:ring-forest-500"
          />
          Has assessment
        </label>
      </div>

      {isEdit && editingLesson?.groupId && (
        <GroupEditOptions
          childName={children.find(c => c.id === editingLesson.childId)?.name ?? 'this learner'}
          applyToGroup={applyToGroup}
          applyScheduleToGroup={applyScheduleToGroup}
          onApplyToGroupChange={setApplyToGroup}
          onApplyScheduleToGroupChange={setApplyScheduleToGroup}
        />
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-forest-900 text-white hover:bg-forest-800 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add lesson'}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete this lesson"
            className="ml-auto flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>
    </form>
  )
}
