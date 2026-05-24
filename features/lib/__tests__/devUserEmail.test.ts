import {
  DEFAULT_DEV_SEED_USER_EMAIL,
  getDevSeedUserEmail,
} from '../server/devUserEmail'

describe('getDevSeedUserEmail', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns DEV_SEED_USER_EMAIL when set', () => {
    process.env = { ...originalEnv, DEV_SEED_USER_EMAIL: 'custom@example.com' }
    expect(getDevSeedUserEmail()).toBe('custom@example.com')
  })

  it('falls back to the default dev email when unset', () => {
    process.env = { ...originalEnv, DEV_SEED_USER_EMAIL: undefined }
    expect(getDevSeedUserEmail()).toBe(DEFAULT_DEV_SEED_USER_EMAIL)
    expect(DEFAULT_DEV_SEED_USER_EMAIL).toBe('dev@sheathacademy.ai')
  })
})
