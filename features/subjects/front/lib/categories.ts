import type { SubjectCourseCategory } from '@/features/subjects/types'

/** Ordered list used in dropdowns — Islamic subjects first. */
export const SUBJECT_COURSE_CATEGORIES: SubjectCourseCategory[] = [
  'Quran',
  'Arabic',
  'IslamicStudies',
  'Math',
  'EnglishELA',
  'Reading',
  'Writing',
  'Science',
  'History',
  'SocialStudies',
  'Geography',
  'Art',
  'PEHealth',
  'Technology',
  'NatureStudy',
  'Logic',
  'LifeSkills',
  'Civics',
  'Economics',
  'Handwriting',
  'VocabularySpelling',
  'ForeignLanguage',
  'OtherCustom',
]

const CATEGORY_DISPLAY: Record<SubjectCourseCategory, string> = {
  Quran: 'Quran',
  Arabic: 'Arabic',
  IslamicStudies: 'Islamic Studies',
  Math: 'Math',
  EnglishELA: 'English/ELA',
  Reading: 'Reading',
  Writing: 'Writing',
  Science: 'Science',
  History: 'History',
  SocialStudies: 'Social Studies',
  Geography: 'Geography',
  Art: 'Art',
  PEHealth: 'PE/Health',
  Technology: 'Technology',
  NatureStudy: 'Nature Study',
  Logic: 'Logic',
  LifeSkills: 'Life Skills',
  Civics: 'Civics',
  Economics: 'Economics',
  Handwriting: 'Handwriting',
  VocabularySpelling: 'Vocabulary/Spelling',
  ForeignLanguage: 'Foreign Language',
  OtherCustom: 'Other/Custom',
  // Legacy
  English: 'English',
  LanguageArts: 'Language Arts',
  Other: 'Other',
}

export function formatCategory(category: SubjectCourseCategory): string {
  return CATEGORY_DISPLAY[category] ?? category
}
