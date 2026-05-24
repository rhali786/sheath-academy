import {
  APP_HEADER_HEIGHT_VAR,
  setAppHeaderHeight,
  clearAppHeaderHeight,
  getAppHeaderHeight,
} from '@/features/layout/lib/appHeaderHeight'

describe('appHeaderHeight', () => {
  afterEach(() => {
    clearAppHeaderHeight()
  })

  it('sets and reads header height in pixels on documentElement', () => {
    setAppHeaderHeight(118)
    expect(getAppHeaderHeight()).toBe('118px')
    expect(
      document.documentElement.style.getPropertyValue(APP_HEADER_HEIGHT_VAR)
    ).toBe('118px')
  })

  it('clears header height from documentElement', () => {
    setAppHeaderHeight(90)
    clearAppHeaderHeight()
    expect(getAppHeaderHeight()).toBe('')
  })
})
