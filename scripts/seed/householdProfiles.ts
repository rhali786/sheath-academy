/** Per-learner behaviour knobs for rich, asymmetric demo history. */
export interface LearnerActivityProfile {
  /** 0–1 — share of due tasks marked completed (historical). */
  completionRate: number
  /** Create a lesson every N days (unique per learner). */
  lessonEveryDays: number
  /** Phase shift so learners don't share the same calendar pattern. */
  lessonPhase: number
  /** Some learners finish 2 tasks on heavy days. */
  extraLessonEveryDays: number
  /** Log Qur'an every N days (0 = learner has no Qur'an subject). */
  quranEveryDays: number
  quranPhase: number
  /** Include Sat/Sun school work. */
  weekendWork: boolean
  /** Attendance probability on a school day (0–1). */
  attendanceRate: number
  /** Per-learner phase for attendance gaps. */
  attendancePhase: number
}

export interface HouseholdActivityProfile {
  hhKey: string
  /** Wizard price bucket keys — not display strings. */
  priceBucket: string
  /** Learner keys pre-marked present for today (offset 0). */
  todayAttendanceKeys: string[]
  /** Days ago (0 = today) when portfolio evidence is created — per learner rotation. */
  evidenceOffsets: number[]
  learners: Record<string, LearnerActivityProfile>
}

/** Barakah Academy — 5 engaged learners, heavy Qur'an, strong completion. */
export const BARAKAH_PROFILE: HouseholdActivityProfile = {
  hhKey: 'a',
  priceBucket: '15',
  todayAttendanceKeys: ['layth', 'hawa', 'idris'],
  evidenceOffsets: [3, 8, 15, 22, 45, 60, 90, 120],
  learners: {
    layth: {
      completionRate: 0.92,
      lessonEveryDays: 2,
      lessonPhase: 0,
      extraLessonEveryDays: 5,
      quranEveryDays: 2,
      quranPhase: 0,
      weekendWork: true,
      attendanceRate: 0.95,
      attendancePhase: 0,
    },
    hawa: {
      completionRate: 0.88,
      lessonEveryDays: 3,
      lessonPhase: 1,
      extraLessonEveryDays: 7,
      quranEveryDays: 3,
      quranPhase: 1,
      weekendWork: false,
      attendanceRate: 0.93,
      attendancePhase: 2,
    },
    idris: {
      completionRate: 0.85,
      lessonEveryDays: 2,
      lessonPhase: 2,
      extraLessonEveryDays: 6,
      quranEveryDays: 2,
      quranPhase: 2,
      weekendWork: true,
      attendanceRate: 0.9,
      attendancePhase: 4,
    },
    safiya: {
      completionRate: 0.9,
      lessonEveryDays: 4,
      lessonPhase: 3,
      extraLessonEveryDays: 8,
      quranEveryDays: 3,
      quranPhase: 3,
      weekendWork: false,
      attendanceRate: 0.94,
      attendancePhase: 1,
    },
    hamza: {
      completionRate: 0.8,
      lessonEveryDays: 3,
      lessonPhase: 4,
      extraLessonEveryDays: 9,
      quranEveryDays: 0,
      quranPhase: 0,
      weekendWork: true,
      attendanceRate: 0.88,
      attendancePhase: 3,
    },
  },
}

/** Crescent Cove — 3 learners, lighter schedule, more gaps. */
export const CRESCENT_COVE_PROFILE: HouseholdActivityProfile = {
  hhKey: 'b',
  priceBucket: '30',
  todayAttendanceKeys: ['khalid'],
  evidenceOffsets: [5, 12, 28, 55, 90],
  learners: {
    khalid: {
      completionRate: 0.55,
      lessonEveryDays: 4,
      lessonPhase: 1,
      extraLessonEveryDays: 11,
      quranEveryDays: 4,
      quranPhase: 0,
      weekendWork: false,
      attendanceRate: 0.72,
      attendancePhase: 0,
    },
    zaynab: {
      completionRate: 0.48,
      lessonEveryDays: 5,
      lessonPhase: 2,
      extraLessonEveryDays: 13,
      quranEveryDays: 5,
      quranPhase: 2,
      weekendWork: false,
      attendanceRate: 0.65,
      attendancePhase: 3,
    },
    maryam: {
      completionRate: 0.6,
      lessonEveryDays: 6,
      lessonPhase: 0,
      extraLessonEveryDays: 14,
      quranEveryDays: 0,
      quranPhase: 0,
      weekendWork: true,
      attendanceRate: 0.7,
      attendancePhase: 5,
    },
  },
}

export function getHouseholdProfile(hhKey: string): HouseholdActivityProfile {
  if (hhKey === 'a') return BARAKAH_PROFILE
  if (hhKey === 'b') return CRESCENT_COVE_PROFILE
  throw new Error(`Unknown household profile key: ${hhKey}`)
}
