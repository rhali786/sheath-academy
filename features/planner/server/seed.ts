import { LessonTask } from '../types'
import { SEED_IDS } from '@/features/lib/seedIds'

function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function getMondayOfCurrentWeek(): Date {
  const today = new Date()
  const dow = today.getDay()
  const offset = dow === 0 ? 6 : dow - 1
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
}

function dateForWeekDay(weeksBack: number, dayOffset: number): string {
  const monday = getMondayOfCurrentWeek()
  const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - weeksBack * 7 + dayOffset)
  return fmt(d)
}

// Children and their subject ID ranges
// Layth:   001-006, Hawa: 007-012, Talut: 013-018, Samurai: 019-024
const CHILDREN = [
  { id: SEED_IDS.layth,   subBase: 1 },
  { id: SEED_IDS.hawa,    subBase: 7 },
  { id: SEED_IDS.talut,   subBase: 13 },
  { id: SEED_IDS.samurai, subBase: 19 },
]

const LESSON_TEMPLATES = [
  // [subjectOffset 0-5, dayOffset 0-4, title, desc]
  [0, 0, 'Islamic Studies — Pillars of Islam',     'Review the five pillars and their importance'],
  [1, 0, 'Math — Multiplication Tables',           'Practice multiplication facts 6–12'],
  [2, 1, 'English — Reading Comprehension',        'Read passage and answer comprehension questions'],
  [3, 1, 'Science — Plant Life Cycle',             'Label diagram and describe each stage'],
  [4, 2, 'Language Arts — Paragraph Writing',      'Write a structured paragraph with topic sentence'],
  [5, 2, 'Technology — Keyboard Skills',           'Typing practice — 15 minutes on home row keys'],
  [0, 3, 'Islamic Studies — Seerah Study',         'Read chapter on the Prophet\'s childhood'],
  [1, 3, 'Math — Word Problems',                   'Solve 10 multi-step word problems'],
  [2, 4, 'English — Spelling and Vocabulary',      'Learn 15 new vocabulary words with sentences'],
  [3, 4, 'Science — States of Matter',             'Experiments and worksheet on solids, liquids, gases'],
] as const

function makeLesson(
  idx: number,
  childId: string,
  subBase: number,
  subjectOffset: number,
  dayOffset: number,
  title: string,
  desc: string,
  weeksBack: number,
): LessonTask {
  const dueDate = dateForWeekDay(weeksBack, dayOffset)
  const isPast = weeksBack > 0
  const completedAt = isPast ? `${dueDate}T15:00:00.000Z` : '2026-01-01T00:00:00.000Z'
  return {
    id: `lesson_seed_${String(idx).padStart(3, '0')}`,
    childId,
    subjectId: `subject_seed_${String(subBase + subjectOffset).padStart(3, '0')}`,
    householdId: SEED_IDS.household,
    title,
    description: desc,
    dueDate,
    status: isPast ? 'completed' : 'not_started',
    order: dayOffset + 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: completedAt,
  }
}

let lessonIdx = 1
const lessons: LessonTask[] = []

// 3 weeks: 2 weeks back (all completed), 1 week back (all completed), current week (not_started)
for (const weeksBack of [2, 1, 0]) {
  for (const child of CHILDREN) {
    for (const [subOff, dayOff, title, desc] of LESSON_TEMPLATES) {
      lessons.push(makeLesson(lessonIdx++, child.id, child.subBase, subOff, dayOff, title, desc, weeksBack))
    }
  }
}

export const SEED_LESSONS: LessonTask[] = lessons
