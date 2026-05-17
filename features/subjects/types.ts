export type SubjectCourseCategory =
  | 'Quran'
  | 'Arabic'
  | 'IslamicStudies'
  | 'Math'
  | 'Reading'
  | 'Science'
  | 'History'
  | 'English'
  | 'LanguageArts'
  | 'Technology'
  | 'Other'

export interface SubjectCourse {
  id: string
  childId: string
  name: string
  category: SubjectCourseCategory
  isActive: boolean
  order: number
  createdAt: string
}
