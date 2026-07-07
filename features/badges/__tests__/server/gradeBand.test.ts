import { resolveGradeBand } from '@/features/badges/server/gradeBand'
import type { GradeBand } from '@/features/gradebook/types'

describe('resolveGradeBand', () => {
  const cases: [string | null | undefined, GradeBand][] = [
    ['K', 'g1_4'],
    ['Pre-K', 'g1_4'],
    ['1', 'g1_4'],
    ['2', 'g1_4'],
    ['3', 'g1_4'],
    ['4', 'g1_4'],
    ['Grade 1', 'g1_4'],
    ['Grade 4', 'g1_4'],
    ['5', 'g5_8'],
    ['6', 'g5_8'],
    ['7', 'g5_8'],
    ['8', 'g5_8'],
    ['Grade 5', 'g5_8'],
    ['9', 'g9_12'],
    ['10', 'g9_12'],
    ['11', 'g9_12'],
    ['12', 'g9_12'],
    ['Grade 12', 'g9_12'],
    [null, 'g5_8'],
    [undefined, 'g5_8'],
    ['', 'g5_8'],
    ['garbage input', 'g5_8'],
    ['Honours 11', 'g9_12'],
  ]

  test.each(cases)('resolveGradeBand(%s) → %s', (input, expected) => {
    expect(resolveGradeBand(input)).toBe(expected)
  })
})
