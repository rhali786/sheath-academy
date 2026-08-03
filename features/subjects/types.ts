import type { DayOfWeek } from '@/features/lib/types'

/** One recurring weekly time block for a course, e.g. "Mon/Wed 9:00-9:45". */
export interface RecurringScheduleBlock {
  daysOfWeek: DayOfWeek[]
  /** 24-hour "HH:MM" string, matching the LessonTask scheduled-time contract. */
  startTime: string
  /** 24-hour "HH:MM" string, matching the LessonTask scheduled-time contract. */
  endTime: string
}

export type SubjectCourseCategory =
  | 'Quran'
  | 'Arabic'
  | 'IslamicStudies'
  | 'Math'
  | 'EnglishELA'
  | 'Reading'
  | 'Writing'
  | 'Science'
  | 'History'
  | 'SocialStudies'
  | 'Geography'
  | 'Art'
  | 'PEHealth'
  | 'Technology'
  | 'NatureStudy'
  | 'Logic'
  | 'LifeSkills'
  | 'Civics'
  | 'Economics'
  | 'Handwriting'
  | 'VocabularySpelling'
  | 'ForeignLanguage'
  | 'OtherCustom'
  // Legacy values kept for backward compatibility
  | 'English'
  | 'LanguageArts'
  | 'Other'

export interface SubjectCourse {
  id: string
  /** Primary learner — kept for backward compat with WeekGrid and other consumers. */
  childId: string
  /** All enrolled learners. Includes childId as first element. */
  learnerIds: string[]
  name: string
  category: SubjectCourseCategory
  /** Optional custom category text, used when category is 'OtherCustom'. */
  customCategory?: string
  /** Optional instructor/teacher name at the course level. */
  instructorName?: string
  /** Optional level descriptor, e.g. "Grade 5", "Algebra I", "Arabic Level 2". */
  level?: string
  /** Optional school year association. */
  schoolYearId?: string
  /** IDs of resources linked to this course. Optional for back-compat with existing fixtures/mocks. */
  resourceIds?: string[]
  /** Optional recurring per-class weekly schedule. Does not auto-generate lesson instances. */
  recurringSchedule?: RecurringScheduleBlock[]
  isActive: boolean
  order: number
  createdAt: string
}
