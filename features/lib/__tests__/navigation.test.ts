import { childScopedHref } from '@/features/lib/front/navigation'

describe('childScopedHref', () => {
  it('returns basePath when childId is undefined', () => {
    expect(childScopedHref('/attendance', undefined)).toBe('/attendance')
  })

  it('returns basePath when childId is null', () => {
    expect(childScopedHref('/attendance', null)).toBe('/attendance')
  })

  it('returns basePath when childId is empty string', () => {
    expect(childScopedHref('/attendance', '')).toBe('/attendance')
  })

  it('appends childId query param when provided', () => {
    expect(childScopedHref('/attendance', 'student_seed_layth_001')).toBe('/attendance?childId=student_seed_layth_001')
  })

  it('URL-encodes the childId value', () => {
    expect(childScopedHref('/lessons', 'student 1')).toBe('/lessons?childId=student%201')
  })

  it('works with any basePath', () => {
    expect(childScopedHref('/quran', 'child_abc')).toBe('/quran?childId=child_abc')
    expect(childScopedHref('/portfolio', 'child_abc')).toBe('/portfolio?childId=child_abc')
  })
})
