'use client'

import { useEffect, useRef, useState } from 'react'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import { formatElapsed } from '@/features/learning-time/front/lib/formatElapsed'
import { plannerApi } from '@/features/plan/front/services/api'
import {
  OUTCOMES,
  TIME_CHANNEL_TYPES,
  type CreateSessionInput,
  type LearningTimeSession,
  type Outcome,
  type TimeChannelType,
} from '@/features/learning-time/types'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectCourse } from '@/features/subjects/types'

interface NowCardProps {
  learnerId: string
  /** The course chosen in the page-level filter. Scopes the Lesson list to it and tags any ad-hoc session with it — there is no separate in-form Course picker. */
  course?: { id: string; name: string }
  /** Current-school-year courses, for labeling each Lesson option with its course name. */
  allSubjects: SubjectCourse[]
}

const TIME_CHANNEL_LABELS: Record<TimeChannelType, string> = {
  stopwatch: 'Stopwatch',
  timer: 'Timer',
  scheduled: 'Scheduled window',
}

const OUTCOME_LABELS: Record<Outcome, string> = {
  complete: 'Complete',
  partial: 'Partial',
  abandoned: 'Abandoned',
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nextLabel(lesson: LessonTask | null | undefined): string {
  if (lesson === undefined) return ''
  if (lesson === null) return 'Nothing assigned now'
  return lesson.estimatedDuration ? `Next: ${lesson.title} (${lesson.estimatedDuration})` : `Next: ${lesson.title}`
}

const inputClass = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500'
const primaryButtonClass = 'px-4 py-2 bg-forest-900 text-white text-sm font-medium rounded-lg hover:bg-forest-800 disabled:opacity-60'
const secondaryButtonClass = 'px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50'

// How often the client polls, while this page is open, to (a) auto-start a draft "Scheduled window"
// session once wall-clock time reaches its scheduledStart and (b) keep the "time to finish" reminder
// current for a running scheduled session. Best-effort only — see the "Starts automatically while this
// page is open" caption; there is no server-side/background guarantee (no confirmed cron/worker
// infrastructure in this repo — see G9 plan Item 1).
const SCHEDULED_CLOCK_POLL_INTERVAL_MS = 30_000

// Bounded auto-start window (G9 plan Item 1 risk note): only auto-start a draft scheduled session while
// wall-clock 'now' is still the same calendar day as its scheduledStart. Without this bound, a tab left
// open for hours/days past a stale scheduled time could surprise-start a session.
function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatTimeLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const DURATION_LABELS: Record<string, string> = {
  '15min': '15 min',
  '30min': '30 min',
  '45min': '45 min',
  '1hr': '1 hr',
  custom: 'Custom',
}

function durationLabel(duration: string | undefined): string {
  if (!duration) return 'No duration set'
  return DURATION_LABELS[duration] ?? duration
}

export function NowCard({ learnerId, course, allSubjects }: NowCardProps) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<LearningTimeSession | null>(null)
  const [finalized, setFinalized] = useState<LearningTimeSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [configuring, setConfiguring] = useState(false)
  const [next, setNext] = useState<LessonTask | null | undefined>(undefined)
  const [openLessons, setOpenLessons] = useState<LessonTask[]>([])
  const [quickStartLessons, setQuickStartLessons] = useState<LessonTask[]>([])

  const [lessonChoice, setLessonChoice] = useState<string>('adhoc')
  const [timeChannelType, setTimeChannelType] = useState<TimeChannelType>('stopwatch')
  const [targetMinutes, setTargetMinutes] = useState<string>('')
  const [scheduledStart, setScheduledStart] = useState<string>('')
  const [scheduledEnd, setScheduledEnd] = useState<string>('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  const [outcome, setOutcome] = useState<Outcome>('complete')
  const [endNotes, setEndNotes] = useState<string>('')
  const [savingOutcome, setSavingOutcome] = useState(false)

  const [now, setNow] = useState<number>(Date.now())
  const fetchedAtRef = useRef<number>(Date.now())
  // Only the very first session check should blank the whole panel with the loading
  // placeholder. Later learnerId changes (switching learners while this card stays mounted)
  // re-validate in the background instead of hiding whatever view is currently showing.
  const hasLoadedOnceRef = useRef(false)
  // Guards the auto-start effect against firing transition() more than once for the same session —
  // a ref (not state) so the check is synchronous across re-renders and rapid polling ticks, even
  // before a prior transition() call has resolved.
  const hasAutoStartedSessionIdRef = useRef<string | null>(null)

  function applySession(s: LearningTimeSession | null) {
    fetchedAtRef.current = Date.now()
    setNow(Date.now())
    setSession(s)
  }

  function resetConfigForm() {
    setLessonChoice('adhoc')
    setTimeChannelType('stopwatch')
    setTargetMinutes('')
    setScheduledStart('')
    setScheduledEnd('')
    setConfigError(null)
  }

  useEffect(() => {
    let cancelled = false
    if (!hasLoadedOnceRef.current) setLoading(true)
    learningTimeApi.getActive(learnerId)
      .then(res => {
        if (cancelled) return
        applySession(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load session')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        hasLoadedOnceRef.current = true
      })
    return () => { cancelled = true }
  }, [learnerId])

  useEffect(() => {
    let cancelled = false
    plannerApi.getLessons(undefined, [learnerId], course ? [course.id] : undefined)
      .then(lessons => {
        if (cancelled) return
        const open = lessons
          .filter(l => l.status === 'not_started')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title))
        setOpenLessons(open)
        const today = todayLocal()
        setNext(open.find(l => l.dueDate === today) ?? null)
      })
      .catch(() => {
        if (cancelled) return
        setOpenLessons([])
        setNext(null)
      })
    return () => { cancelled = true }
  }, [learnerId, course?.id])

  // Independent of the page-level course filter: fetches every open lesson for this learner
  // (no subject filter) so the quick-start course list below can show each course's next
  // configured duration regardless of which course (if any) is selected at the top of the page.
  useEffect(() => {
    let cancelled = false
    plannerApi.getLessons(undefined, [learnerId], undefined)
      .then(lessons => {
        if (cancelled) return
        setQuickStartLessons(lessons.filter(l => l.status === 'not_started'))
      })
      .catch(() => {
        if (!cancelled) setQuickStartLessons([])
      })
    return () => { cancelled = true }
  }, [learnerId])

  const quickStartCourses = allSubjects
    .filter(s => (s.learnerIds ?? []).includes(learnerId))
    .map(s => {
      const nextLesson = quickStartLessons
        .filter(l => l.subjectId === s.id)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
      return { id: s.id, name: s.name, duration: nextLesson?.estimatedDuration }
    })

  async function handleQuickStart(quickCourse: { id: string; name: string }) {
    setError(null)
    try {
      const input: CreateSessionInput = {
        learnerId,
        timeChannelType: 'stopwatch',
        subjectId: quickCourse.id,
      }
      const created = await learningTimeApi.createSession(input)
      const started = await learningTimeApi.transition(created.data.id, { action: 'start' })
      applySession(started.data)
    } catch {
      setError('Failed to start session. Please try again.')
    }
  }

  useEffect(() => {
    if (session?.status !== 'running') return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [session?.status])

  // Clock-driven auto-start (G9 plan Item 1, decided design #2): while a "Scheduled window" session
  // sits in 'draft' status and this page is open, poll wall-clock time against scheduledStart and
  // call transitionSession('start') automatically once reached — no manual click required. This is
  // explicitly page-open-dependent/best-effort; there is no server-side auto-start in this plan.
  useEffect(() => {
    if (!session || session.status !== 'draft' || session.timeChannelType !== 'scheduled' || !session.scheduledStart) return
    const sessionId = session.id
    const scheduledStartIso = session.scheduledStart
    const scheduledStartMs = new Date(scheduledStartIso).getTime()
    if (Number.isNaN(scheduledStartMs)) return

    function checkAutoStart() {
      if (hasAutoStartedSessionIdRef.current === sessionId) return
      const nowDate = new Date()
      if (nowDate.getTime() < scheduledStartMs) return
      if (!isSameCalendarDay(nowDate, new Date(scheduledStartMs))) return
      hasAutoStartedSessionIdRef.current = sessionId
      learningTimeApi.transition(sessionId, { action: 'start' })
        .then(res => applySession(res.data))
        .catch(() => {
          // Allow a later poll to retry after a transient failure.
          if (hasAutoStartedSessionIdRef.current === sessionId) hasAutoStartedSessionIdRef.current = null
        })
    }

    checkAutoStart()
    const interval = setInterval(checkAutoStart, SCHEDULED_CLOCK_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [session?.id, session?.status, session?.timeChannelType, session?.scheduledStart])

  const elapsedSeconds = session
    ? session.elapsedSeconds + (session.status === 'running' ? Math.floor((now - fetchedAtRef.current) / 1000) : 0)
    : 0

  // Idle-but-scheduled state (acceptance criterion 5): a draft scheduled session whose start time
  // hasn't arrived yet. Excluded while the parent has the config panel explicitly open (`configuring`)
  // so hand-editing/overriding the pre-filled times is never blocked by this read-only state.
  const scheduledSessionNotYetDue = Boolean(
    session
    && !configuring
    && session.status === 'draft'
    && session.timeChannelType === 'scheduled'
    && session.scheduledStart
    && new Date(session.scheduledStart).getTime() > now,
  )

  // "Time to finish" reminder (acceptance criterion 6): visible prompt only — never a silent
  // auto-finalize. The existing manual Finish -> outcome -> Save flow is unchanged.
  const scheduledSessionPastEnd = Boolean(
    session
    && session.status === 'running'
    && session.timeChannelType === 'scheduled'
    && session.scheduledEnd
    && now >= new Date(session.scheduledEnd).getTime(),
  )

  async function handleConfigSubmit() {
    setSavingConfig(true)
    setConfigError(null)
    try {
      if (session && session.status === 'draft') {
        const started = await learningTimeApi.transition(session.id, { action: 'start' })
        applySession(started.data)
      } else {
        const input: CreateSessionInput = {
          learnerId,
          timeChannelType,
        }
        if (lessonChoice !== 'adhoc') input.lessonTaskId = lessonChoice
        if (course) input.subjectId = course.id
        if (timeChannelType === 'timer' && targetMinutes) input.targetMinutes = Number(targetMinutes)
        if (timeChannelType === 'scheduled') {
          const today = todayLocal()
          if (scheduledStart) input.scheduledStart = `${today}T${scheduledStart}:00`
          if (scheduledEnd) input.scheduledEnd = `${today}T${scheduledEnd}:00`
        }
        const created = await learningTimeApi.createSession(input)
        const started = await learningTimeApi.transition(created.data.id, { action: 'start' })
        applySession(started.data)
      }
      setConfiguring(false)
      resetConfigForm()
    } catch {
      setConfigError('Failed to start session. Please try again.')
    } finally {
      setSavingConfig(false)
    }
  }

  // Pre-fill from lesson (G9 plan Item 1, decided design #1): picking a lesson that has both
  // scheduledStartTime/scheduledEndTime (LessonTask, G7a) auto-selects the "Scheduled window" channel
  // and fills the time inputs from the lesson — still hand-editable/overridable afterward. Ad-hoc, or a
  // lesson without those fields set, leaves the channel/time fields exactly as they were (regression).
  function handleLessonChoiceChange(id: string) {
    setLessonChoice(id)
    if (id === 'adhoc') return
    const lesson = openLessons.find(l => l.id === id)
    if (lesson?.scheduledStartTime && lesson?.scheduledEndTime) {
      setTimeChannelType('scheduled')
      setScheduledStart(lesson.scheduledStartTime)
      setScheduledEnd(lesson.scheduledEndTime)
    }
  }

  function handleCancelConfig() {
    setConfiguring(false)
    resetConfigForm()
  }

  async function handlePause() {
    if (!session) return
    const res = await learningTimeApi.transition(session.id, { action: 'pause' })
    applySession(res.data)
  }

  async function handleResume() {
    if (!session) return
    const res = await learningTimeApi.transition(session.id, { action: 'resume' })
    applySession(res.data)
  }

  async function handleFinish() {
    if (!session) return
    const res = await learningTimeApi.transition(session.id, { action: 'end' })
    applySession(res.data)
  }

  async function handleSaveOutcome() {
    if (!session) return
    setSavingOutcome(true)
    try {
      const res = await learningTimeApi.transition(session.id, {
        action: 'finalize',
        outcome,
        notes: endNotes.trim() || undefined,
      })
      setFinalized(res.data)
      setSession(null)
    } finally {
      setSavingOutcome(false)
    }
  }

  function handleStartAnother() {
    setFinalized(null)
    setSession(null)
    setOutcome('complete')
    setEndNotes('')
    resetConfigForm()
  }

  const nextText = nextLabel(next)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
        <p className="text-sm text-slate-400 py-4" data-testid="now-card-loading">Loading…</p>
      </div>
    )
  }

  if (finalized) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
        <div data-testid="now-card-finalized">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Session complete</p>
          <p className="text-2xl font-bold text-slate-900 mb-1">{formatElapsed(finalized.elapsedSeconds)}</p>
          <p className="text-sm text-slate-500 mb-1">
            Outcome: {finalized.outcome ? OUTCOME_LABELS[finalized.outcome] : '—'}
          </p>
          {finalized.notes && <p className="text-sm text-slate-500 mb-3">{finalized.notes}</p>}
          <button type="button" onClick={handleStartAnother} data-testid="start-another-button" className={primaryButtonClass}>
            Start another session
          </button>
        </div>
      </div>
    )
  }

  if (scheduledSessionNotYetDue && session && session.scheduledStart) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
        <div data-testid="now-card-scheduled-pending">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Now</p>
          <p className="text-lg font-semibold text-slate-900 mb-1">Starts at {formatTimeLabel(session.scheduledStart)}</p>
          <p className="text-sm text-slate-500 mb-1">{nextText || 'Nothing assigned now'}</p>
          <p className="text-xs text-slate-400 mb-4">Starts automatically while this page is open.</p>
          <button
            type="button"
            onClick={() => setConfiguring(true)}
            data-testid="edit-scheduled-session-button"
            className={secondaryButtonClass}
          >
            Edit or start now
          </button>
        </div>
      </div>
    )
  }

  if (configuring || session?.status === 'draft') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
        <div data-testid="now-card-config">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Now</p>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Configure session</h2>
          {configError && <p className="text-sm text-red-500 mb-2">{configError}</p>}

          <div className="mb-3">
            <label htmlFor="lt-lesson" className="block text-sm font-medium text-slate-700 mb-1">Lesson</label>
            <select
              id="lt-lesson"
              data-testid="lesson-select"
              value={lessonChoice}
              onChange={e => handleLessonChoiceChange(e.target.value)}
              className={inputClass}
            >
              <option value="adhoc">Ad-hoc</option>
              {openLessons.map(l => {
                const courseName = allSubjects.find(s => s.id === l.subjectId)?.name
                return (
                  <option key={l.id} value={l.id}>
                    {l.title} {courseName ? `(${courseName}) ` : ''}(due {l.dueDate})
                  </option>
                )
              })}
            </select>
          </div>


          <fieldset className="mb-3">
            <legend className="block text-sm font-medium text-slate-700 mb-1">Time channel</legend>
            {TIME_CHANNEL_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                <input
                  type="radio"
                  name="timeChannelType"
                  value={type}
                  checked={timeChannelType === type}
                  onChange={() => setTimeChannelType(type)}
                  data-testid={`channel-${type}`}
                />
                {TIME_CHANNEL_LABELS[type]}
              </label>
            ))}
          </fieldset>

          {timeChannelType === 'timer' && (
            <div className="mb-3">
              <label htmlFor="lt-target-minutes" className="block text-sm font-medium text-slate-700 mb-1">Target minutes</label>
              <input
                id="lt-target-minutes"
                type="number"
                min={1}
                data-testid="target-minutes-input"
                value={targetMinutes}
                onChange={e => setTargetMinutes(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {timeChannelType === 'scheduled' && (
            <div className="mb-3 flex gap-3">
              <div className="flex-1">
                <label htmlFor="lt-scheduled-start" className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
                <input
                  id="lt-scheduled-start"
                  type="time"
                  data-testid="scheduled-start-input"
                  value={scheduledStart}
                  onChange={e => setScheduledStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="lt-scheduled-end" className="block text-sm font-medium text-slate-700 mb-1">End time</label>
                <input
                  id="lt-scheduled-end"
                  type="time"
                  data-testid="scheduled-end-input"
                  value={scheduledEnd}
                  onChange={e => setScheduledEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {timeChannelType === 'scheduled' && (
            <p className="text-xs text-slate-400 -mt-2 mb-3">
              Applies to this session only, today — not a recurring daily schedule. Starts automatically while this page stays open.
            </p>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={handleConfigSubmit} disabled={savingConfig} data-testid="start-button" className={primaryButtonClass}>
              Start
            </button>
            {!(session?.status === 'draft') && (
              <button type="button" onClick={handleCancelConfig} data-testid="cancel-config-button" className={secondaryButtonClass}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
        <div data-testid="now-card-idle">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Now</p>
          <p className="text-lg font-semibold text-slate-900 mb-1">Idle — awaiting assignment</p>
          <p className="text-sm text-slate-500 mb-4">{nextText || 'Nothing assigned now'}</p>
          <button type="button" onClick={() => setConfiguring(true)} data-testid="start-session-button" className={primaryButtonClass}>
            Start session
          </button>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

          {quickStartCourses.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100" data-testid="quick-start-list">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Quick start by course</p>
              <ul className="space-y-2">
                {quickStartCourses.map(qc => (
                  <li key={qc.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{qc.name}</p>
                      <p className="text-xs text-slate-400" data-testid={`quick-start-duration-${qc.id}`}>
                        {durationLabel(qc.duration)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickStart(qc)}
                      data-testid={`quick-start-course-${qc.id}`}
                      className={secondaryButtonClass}
                    >
                      Start
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (session.status === 'running' || session.status === 'paused') {
    const testId = session.status === 'running' ? 'now-card-running' : 'now-card-paused'
    return (
      <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
        <div data-testid={testId}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Now</p>
          <p className="text-sm font-medium text-forest-700 mb-1">
            {TIME_CHANNEL_LABELS[session.timeChannelType]}
            {session.targetMinutes ? ` · Target ${session.targetMinutes}m` : ''}
          </p>
          <p className="text-4xl font-bold text-slate-900 mb-1" aria-live="polite" data-testid="elapsed-time">
            {formatElapsed(elapsedSeconds)}
          </p>
          <p className="text-sm text-slate-400 mb-4">{nextText || 'Nothing assigned now'}</p>
          {scheduledSessionPastEnd && (
            <p className="text-sm text-amber-600 mb-3" role="status" data-testid="scheduled-end-reminder">
              Time to finish — the scheduled window has ended. Click Finish when you&apos;re done.
            </p>
          )}
          <div className="flex gap-2">
            {session.timeChannelType !== 'scheduled' && (
              session.status === 'running' ? (
                <button type="button" onClick={handlePause} data-testid="pause-button" className={secondaryButtonClass}>
                  Pause
                </button>
              ) : (
                <button type="button" onClick={handleResume} data-testid="resume-button" className={secondaryButtonClass}>
                  Resume
                </button>
              )
            )}
            <button type="button" onClick={handleFinish} data-testid="finish-button" className={primaryButtonClass}>
              Finish
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (session.status === 'ended') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
        <div data-testid="now-card-ended">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Session ended</p>
          <p className="text-2xl font-bold text-slate-900 mb-3">{formatElapsed(session.elapsedSeconds)}</p>

          <fieldset className="mb-3">
            <legend className="block text-sm font-medium text-slate-700 mb-1">Outcome</legend>
            {OUTCOMES.map(o => (
              <label key={o} className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                <input
                  type="radio"
                  name="outcome"
                  value={o}
                  checked={outcome === o}
                  onChange={() => setOutcome(o)}
                  data-testid={`outcome-${o}`}
                />
                {OUTCOME_LABELS[o]}
              </label>
            ))}
          </fieldset>

          <div className="mb-3">
            <label htmlFor="lt-notes" className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <textarea
              id="lt-notes"
              data-testid="notes-textarea"
              rows={3}
              value={endNotes}
              onChange={e => setEndNotes(e.target.value)}
              className={inputClass}
            />
          </div>

          <button type="button" onClick={handleSaveOutcome} disabled={savingOutcome} data-testid="save-outcome-button" className={primaryButtonClass}>
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" data-testid="now-card">
      <div data-testid="now-card-idle">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Now</p>
        <p className="text-lg font-semibold text-slate-900 mb-1">Idle — awaiting assignment</p>
        <p className="text-sm text-slate-500 mb-4">{nextText || 'Nothing assigned now'}</p>
        <button type="button" onClick={() => setConfiguring(true)} data-testid="start-session-button" className={primaryButtonClass}>
          Start session
        </button>
      </div>
    </div>
  )
}
