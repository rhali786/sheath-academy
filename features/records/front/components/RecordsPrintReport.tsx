import type { QuranSession } from '@/features/lib/types'
import { formatAttendanceSummaryLine } from '@/features/attendance/front/lib/summaryDisplay'
import type { RecordsReport } from '@/features/records/types'

export type RecordsPrintVariant =
  | 'full'
  | 'attendance'
  | 'progress'
  | 'portfolio'
  | 'quran'
  | 'islamic'

const VARIANT_TITLES: Record<RecordsPrintVariant, string> = {
  full: 'Records summary',
  attendance: 'Attendance report',
  progress: 'Progress report',
  portfolio: 'Portfolio export',
  quran: 'Quran summary',
  islamic: 'Islamic studies report',
}

const ISLAMIC_CATEGORIES = new Set(['Quran', 'Arabic', 'IslamicStudies'])

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function filterSessionsInRange(sessions: QuranSession[], start: string, end: string): QuranSession[] {
  return sessions
    .filter((s) => s.date >= start && s.date <= end)
    .sort((a, b) => b.date.localeCompare(a.date))
}

interface RecordsPrintReportProps {
  report: RecordsReport
  variant?: RecordsPrintVariant
  quranSessions?: QuranSession[]
  className?: string
}

export function RecordsPrintReport({
  report,
  variant = 'full',
  quranSessions = [],
  className = '',
}: RecordsPrintReportProps) {
  const islamicSubjects = report.subjects.filter((s) => ISLAMIC_CATEGORIES.has(s.category))
  const islamicProgress = report.progressBySubject.filter((row) =>
    islamicSubjects.some((s) => s.id === row.subjectId),
  )
  const attendanceChecklist = report.checklist.filter(
    (item) => item.id === 'missing_attendance_records',
  )
  const progressChecklist = report.checklist.filter(
    (item) => item.id === 'subjects_without_completed_work',
  )
  const portfolioChecklist = report.checklist.filter(
    (item) => item.id === 'no_portfolio_evidence',
  )
  const sessionsInRange = filterSessionsInRange(
    quranSessions,
    report.dateRange.start,
    report.dateRange.end,
  )

  const showAttendance = variant === 'full' || variant === 'attendance'
  const showProgress = variant === 'full' || variant === 'progress' || variant === 'islamic'
  const showPortfolio = variant === 'full' || variant === 'portfolio'
  const showQuran = variant === 'full' || variant === 'quran'
  const showChecklist =
    variant === 'full' ||
    (variant === 'attendance' && attendanceChecklist.length > 0) ||
    (variant === 'progress' && progressChecklist.length > 0) ||
    (variant === 'portfolio' && portfolioChecklist.length > 0)

  const checklistItems =
    variant === 'full'
      ? report.checklist
      : variant === 'attendance'
        ? attendanceChecklist
        : variant === 'progress'
          ? progressChecklist
          : variant === 'portfolio'
            ? portfolioChecklist
            : []

  const progressRows =
    variant === 'islamic' ? islamicProgress : report.progressBySubject

  return (
    <article className={`print-report space-y-8 bg-white px-6 py-6 shadow-sm ${className}`.trim()}>
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Sheath Academy Records</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{VARIANT_TITLES[variant]}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {report.child.name} | {report.child.gradeLabel} | {report.dateRange.start} to{' '}
          {report.dateRange.end}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Generated:{' '}
          {new Date(report.generatedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </header>

      {showChecklist && (
        <section>
          <h3 className="text-base font-bold text-slate-900">Records review</h3>
          {checklistItems.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No advisory checklist items for this report.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {checklistItems.map((item) => (
                <li
                  key={item.id}
                  className="print-callout rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-amber-900">{item.label}</p>
                  <p className="text-sm text-amber-800">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showAttendance && (
        <section className="print-stats grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Attendance</h3>
            <p className="mt-2 text-3xl font-bold text-slate-900">{report.attendance.totalRecorded}</p>
            <p className="text-sm text-slate-600">{formatAttendanceSummaryLine(report.attendance)}</p>
          </div>
          {(variant === 'full' || variant === 'islamic') && (
            <>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Subjects</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {variant === 'islamic' ? islamicSubjects.length : report.subjects.length}
                </p>
                <p className="text-sm text-slate-600">
                  {(variant === 'islamic' ? islamicSubjects : report.subjects)
                    .map((subject) => subject.name)
                    .join(', ') || 'None recorded'}
                </p>
              </div>
              {variant === 'full' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Portfolio evidence</h3>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{report.portfolio.count}</p>
                  <p className="text-sm text-slate-600">Newest evidence appears first.</p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {showProgress && progressRows.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-slate-900">Progress by subject</h3>
          <div className="mt-3 divide-y divide-slate-100">
            {progressRows.map((subject) => (
              <div key={`${subject.childId}-${subject.subjectId}`} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-800">{subject.subjectName}</span>
                  <span className="text-sm text-slate-600">
                    {percent(subject.completionRate)} complete
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {subject.completedCount} completed of {subject.plannedCount} planned
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {showProgress && variant === 'progress' && report.completedLessons.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-slate-900">Completed lessons</h3>
          <div className="mt-3 space-y-2">
            {report.completedLessons.slice(0, 25).map((lesson) => (
              <div key={lesson.id} className="border-t border-slate-100 pt-2">
                <p className="text-sm font-semibold text-slate-900">{lesson.title}</p>
                <p className="text-xs text-slate-500">{lesson.dueDate}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {showPortfolio && (
        <section>
          <h3 className="text-base font-bold text-slate-900">Portfolio notes</h3>
          {report.portfolio.items.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No portfolio evidence in this date range.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {report.portfolio.items.map((item) => (
                <div key={item.id} className="border-t border-slate-100 pt-3">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.date} | {item.type}
                  </p>
                  {item.notes && <p className="mt-1 text-sm text-slate-700">{item.notes}</p>}
                  {item.reflection && <p className="mt-1 text-sm text-slate-700">{item.reflection}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showQuran && (
        <section>
          <h3 className="text-base font-bold text-slate-900">Quran sessions</h3>
          {sessionsInRange.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No Quran sessions in this date range.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {sessionsInRange.map((session) => (
                <div key={session.id} className="border-t border-slate-100 pt-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {session.surah} ({session.type})
                  </p>
                  <p className="text-xs text-slate-500">
                    {session.date} | ayah {session.fromAyah}–{session.toAyah}
                  </p>
                  {session.notes && <p className="mt-1 text-sm text-slate-700">{session.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </article>
  )
}
