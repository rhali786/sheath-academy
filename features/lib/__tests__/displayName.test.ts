import { displayName } from '../displayName'

describe('displayName', () => {
  it('returns name when set', () => {
    expect(displayName({ name: 'Fatima Ali', email: 'fatima@x.com' })).toBe('Fatima Ali')
  })

  it('falls back to email when name is null', () => {
    expect(displayName({ name: null, email: 'fatima@x.com' })).toBe('fatima@x.com')
  })

  it('falls back to email when name is undefined', () => {
    expect(displayName({ email: 'fatima@x.com' })).toBe('fatima@x.com')
  })

  it('falls back to email when name is empty string', () => {
    expect(displayName({ name: '', email: 'fatima@x.com' })).toBe('fatima@x.com')
  })

  it('falls back to email when name is whitespace only', () => {
    expect(displayName({ name: '   ', email: 'fatima@x.com' })).toBe('fatima@x.com')
  })

  it('returns empty string when both are null/undefined', () => {
    expect(displayName({})).toBe('')
    expect(displayName({ name: null, email: null })).toBe('')
  })
})
