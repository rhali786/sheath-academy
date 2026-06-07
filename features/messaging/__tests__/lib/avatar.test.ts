import { getAvatarSeed, getAvatarStyle, getInitials } from '@/features/messaging/front/lib/avatar'

describe('messaging avatar helpers', () => {
  it('derives two-letter initials from a full name', () => {
    expect(getInitials('Rasheed Ali')).toBe('RA')
  })

  it('derives initials from email when name is missing', () => {
    expect(getInitials(null, 'bob@example.com')).toBe('BO')
  })

  it('uses a stable seed for the same person', () => {
    expect(getAvatarSeed('Rasheed Ali', 'rasheed@example.com')).toBe('rasheed ali')
  })

  it('returns a deterministic gradient style for the same seed', () => {
    const seed = getAvatarSeed('Other Person', 'other@example.com')
    expect(getAvatarStyle(seed)).toEqual(getAvatarStyle(seed))
  })
})
