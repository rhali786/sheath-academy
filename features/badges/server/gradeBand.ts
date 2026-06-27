import type { GradeBand } from '@/features/gradebook/types'

/**
 * Maps a learner's free-text gradeLabel to a grade band.
 * K/Pre-K/1-4 → g1_4; 5-8 → g5_8; 9-12 → g9_12
 * null/undefined/garbage → g5_8 (safe neutral default).
 */
export function resolveGradeBand(gradeLabel: string | null | undefined): GradeBand {
  if (!gradeLabel) return 'g5_8'

  const label = gradeLabel.trim()

  if (/pre[-\s]?k/i.test(label) || /^k$/i.test(label)) return 'g1_4'

  const match = label.match(/(\d+)/)
  if (!match) return 'g5_8'

  const grade = parseInt(match[1], 10)
  if (grade >= 1 && grade <= 4) return 'g1_4'
  if (grade >= 5 && grade <= 8) return 'g5_8'
  if (grade >= 9 && grade <= 12) return 'g9_12'

  return 'g5_8'
}
