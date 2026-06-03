import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Palette,
  Coffee,
  UtensilsCrossed,
  BookMarked,
  Languages,
  PenLine,
  Microscope,
  Dumbbell,
  Laptop,
  Leaf,
  Brain,
  Heart,
  Landmark,
  Coins,
  Pencil,
  SpellCheck,
  MessageCircle,
} from 'lucide-react'
import type { SubjectCourseCategory } from '@/features/subjects/types'

export type SubjectScheduleStyle = {
  Icon: LucideIcon
  dotClass: string
  iconBgClass: string
}

const CATEGORY_STYLES: Partial<Record<SubjectCourseCategory, SubjectScheduleStyle>> = {
  Quran: { Icon: BookMarked, dotClass: 'bg-forest-600', iconBgClass: 'bg-forest-50 text-forest-800' },
  IslamicStudies: { Icon: BookMarked, dotClass: 'bg-forest-600', iconBgClass: 'bg-forest-50 text-forest-800' },
  Math: { Icon: Calculator, dotClass: 'bg-blue-600', iconBgClass: 'bg-blue-50 text-blue-700' },
  EnglishELA: { Icon: PenLine, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  English: { Icon: PenLine, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  LanguageArts: { Icon: PenLine, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  Reading: { Icon: BookOpen, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  Writing: { Icon: PenLine, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  Science: { Icon: FlaskConical, dotClass: 'bg-orange-500', iconBgClass: 'bg-orange-50 text-orange-700' },
  NatureStudy: { Icon: Leaf, dotClass: 'bg-orange-500', iconBgClass: 'bg-orange-50 text-orange-700' },
  History: { Icon: Globe, dotClass: 'bg-blue-600', iconBgClass: 'bg-blue-50 text-blue-700' },
  SocialStudies: { Icon: Globe, dotClass: 'bg-blue-600', iconBgClass: 'bg-blue-50 text-blue-700' },
  Geography: { Icon: Globe, dotClass: 'bg-blue-600', iconBgClass: 'bg-blue-50 text-blue-700' },
  Art: { Icon: Palette, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  Arabic: { Icon: Languages, dotClass: 'bg-forest-600', iconBgClass: 'bg-forest-50 text-forest-800' },
  PEHealth: { Icon: Dumbbell, dotClass: 'bg-slate-500', iconBgClass: 'bg-slate-100 text-slate-600' },
  Technology: { Icon: Laptop, dotClass: 'bg-slate-500', iconBgClass: 'bg-slate-100 text-slate-600' },
  Logic: { Icon: Brain, dotClass: 'bg-slate-500', iconBgClass: 'bg-slate-100 text-slate-600' },
  LifeSkills: { Icon: Heart, dotClass: 'bg-slate-500', iconBgClass: 'bg-slate-100 text-slate-600' },
  Civics: { Icon: Landmark, dotClass: 'bg-blue-600', iconBgClass: 'bg-blue-50 text-blue-700' },
  Economics: { Icon: Coins, dotClass: 'bg-blue-600', iconBgClass: 'bg-blue-50 text-blue-700' },
  Handwriting: { Icon: Pencil, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  VocabularySpelling: { Icon: SpellCheck, dotClass: 'bg-violet-600', iconBgClass: 'bg-violet-50 text-violet-700' },
  ForeignLanguage: { Icon: MessageCircle, dotClass: 'bg-slate-500', iconBgClass: 'bg-slate-100 text-slate-600' },
}

const DEFAULT_STYLE: SubjectScheduleStyle = {
  Icon: BookOpen,
  dotClass: 'bg-slate-400',
  iconBgClass: 'bg-slate-100 text-slate-600',
}

export function getBreakEntryStyle(kind: 'break' | 'meal' | 'prayer'): SubjectScheduleStyle {
  if (kind === 'break') {
    return { Icon: Coffee, dotClass: 'bg-slate-300', iconBgClass: 'bg-slate-100 text-slate-500' }
  }
  return { Icon: UtensilsCrossed, dotClass: 'bg-slate-300', iconBgClass: 'bg-slate-100 text-slate-500' }
}

export function getSubjectScheduleStyle(category: SubjectCourseCategory | undefined): SubjectScheduleStyle {
  if (!category) return DEFAULT_STYLE
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE
}

export function getSubjectScheduleStyleBySubjectId(
  subjectId: string,
  subjectsById: Map<string, { category: SubjectCourseCategory }>,
): SubjectScheduleStyle {
  const subject = subjectsById.get(subjectId)
  return getSubjectScheduleStyle(subject?.category)
}
