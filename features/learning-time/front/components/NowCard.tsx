'use client'

import { useEffect, useRef, useState } from 'react'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import { formatElapsed } from '@/features/learning-time/front/lib/formatElapsed'
import { plannerApi } from '@/features/plan/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'
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
  /** Pre-fills the ad-hoc session's Course field from the page-level filter — a suggestion, not a lock; always overridable per session. */
  defaultCourse?: { id: string; name: string }
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

export function NowCard({ learnerId, defaultCourse }: NowCardProps) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<LearningTimeSession | null>(null)
  const [finalized, setFinalized] = useState<LearningTimeSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [configuring, setConfiguring] = useState(false)
  const [next, setNext] = useState<LessonTask | null | undefined>(undefined)
  const [openLessons, setOpenLessons] = useState<LessonTask[]>([])
  const [subjects, setSubjects] = useState<SubjectCourse[]>([])

  const [lessonChoice, setLessonChoice] = useState<string>('adhoc')
  const [subjectId, setSubjectId] = useState<string>('')
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

  function applySession(s: LearningTimeSession | null) {
    fetchedAtRef.current = Date.now()
    setNow(Date.now())
    setSession(s)
  }

  function resetConfigForm() {
    setLessonChoice('adhoc')
    setSubjectId('')
    setTimeChannelType('stopwatch')
    setTargetMinutes('')
    setScheduledStart('')
    setScheduledEnd('')
    setConfigError(null)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    learningTimeApi.getActive(learnerId)
      .then(res => {
        if (cancelled) return
        applySession(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load session')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [learnerId])

  useEffect(() => {
    plannerApi.getLessons(undefined, [learnerId], defaultCourse ? [defaultCourse.id] : undefined)
      .then(lessons => {
        const open = lessons
          .filter(l => l.status === 'not_started')
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title))
        setOpenLessons(open)
        const today = todayLocal()
        setNext(open.find(l => l.dueDate === today) ?? null)
      })
      .catch(() => {
        setOpenLessons([])
        setNext(null)
      })
  }, [learnerId, defaultCourse?.id])

  useEffect(() => {
    subjectsApi.getSubjects(learnerId)
      .then(res => setSubjects(res.data))
      .catch(() => setSubjects([]))
  }, [learnerId])

  useEffect(() => {
    if (session?.status !== 'running') return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [session?.status])

  // Default the ad-hoc Course field from the page-level pick, without clobbering an in-progress edit.
  useEffect(() => {
    if (!configuring) setSubjectId(defaultCourse?.id ?? '')
  }, [defaultCourse?.id, configuring])

  const elapsedSeconds = session
    ? session.elapsedSeconds + (session.status === 'running' ? Math.floor((now - fetchedAtRef.current) / 1000) : 0)
    : 0

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
        if (subjectId) input.subjectId = subjectId
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
              onChange={e => setLessonChoice(e.target.value)}
              className={inputClass}
            >
              <option value="adhoc">Ad-hoc</option>
              {openLessons.map(l => (
                <option key={l.id} value={l.id}>{l.title} (due {l.dueDate})</option>
              ))}
            </select>
          </div>

          {lessonChoice === 'adhoc' && (
            <div className="mb-3">
              <label htmlFor="lt-subject" className="block text-sm font-medium text-slate-700 mb-1">Course (optional)</label>
              <select
                id="lt-subject"
                data-testid="subject-select"
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className={inputClass}
              >
                <option value="">No course</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {defaultCourse && (
                <p className="text-xs text-slate-400 mt-1">
                  Defaults to {defaultCourse.name} from the filter above — change or clear it for just this session.
                </p>
              )}
            </div>
          )}

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
              Applies to this session only, today — not a recurring daily schedule.
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
