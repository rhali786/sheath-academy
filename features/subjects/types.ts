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
  isActive: boolean
  order: number
  createdAt: string
}
