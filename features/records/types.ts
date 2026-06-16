import type { AttendanceSummary } from '@/features/attendance/types'
import type { StudentProfile } from '@/features/lib/types'
import type { EvidenceItem } from '@/features/portfolio/types'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectProgressSummary } from '@/features/plan/utils/progressBySubject'
import type { SubjectCourse } from '@/features/subjects/types'

export interface ReportDateRange {
  start: string
  end: string
}

export interface RecordsChecklistItem {
  id: 'missing_attendance_records' | 'subjects_without_completed_work' | 'no_portfolio_evidence'
  label: string
  detail: string
  severity: 'info' | 'warning'
  blocking: false
}

export interface TimeBySubject {
  subjectId: string | null
  subjectName: string
  totalMinutes: number
}

export interface RecordsReport {
  child: StudentProfile
  dateRange: ReportDateRange
  subjects: SubjectCourse[]
  attendance: AttendanceSummary
  completedLessons: LessonTask[]
  progressBySubject: SubjectProgressSummary[]
  portfolio: {
    count: number
    items: EvidenceItem[]
  }
  timeBySubject: TimeBySubject[]
  checklist: RecordsChecklistItem[]
  generatedAt: string
}

export interface RecordsReportOptions {
  childId: string
  startDate?: string
  endDate?: string
}
