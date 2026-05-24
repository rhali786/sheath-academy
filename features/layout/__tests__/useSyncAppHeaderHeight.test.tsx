/**
 * @jest-environment jsdom
 */
import React, { useRef } from 'react'
import { render, waitFor } from '@testing-library/react'
import { useSyncAppHeaderHeight } from '@/features/layout/front/hooks/useSyncAppHeaderHeight'
import { getAppHeaderHeight } from '@/features/layout/lib/appHeaderHeight'

function TestHost() {
  const ref = useRef<HTMLElement>(null)
  useSyncAppHeaderHeight(ref)
  return (
    <header ref={ref} data-testid="header">
      Header
    </header>
  )
}

describe('useSyncAppHeaderHeight', () => {
  let resizeObserverCallback: ResizeObserverCallback | null = null
  const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight'
  )

  beforeEach(() => {
    resizeObserverCallback = null
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        if (this instanceof HTMLElement && this.dataset.testid === 'header') {
          return 120
        }
        return offsetHeightDescriptor?.get?.call(this) ?? 0
      },
    })

    class MockResizeObserver {
      observe = jest.fn()
      disconnect = jest.fn()
      constructor(cb: ResizeObserverCallback) {
        resizeObserverCallback = cb
      }
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--app-header-height')
    if (offsetHeightDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeightDescriptor)
    }
  })

  it('writes measured header height to --app-header-height on mount', async () => {
    render(<TestHost />)
    await waitFor(() => {
      expect(getAppHeaderHeight()).toBe('120px')
    })
  })

  it('updates --app-header-height when ResizeObserver fires', async () => {
    render(<TestHost />)
    await waitFor(() => expect(getAppHeaderHeight()).toBe('120px'))

    const header = document.querySelector('[data-testid="header"]') as HTMLElement
    Object.defineProperty(header, 'offsetHeight', {
      configurable: true,
      value: 96,
    })

    resizeObserverCallback?.([], {} as ResizeObserver)

    await waitFor(() => {
      expect(getAppHeaderHeight()).toBe('96px')
    })
  })

  it('clears --app-header-height on unmount', async () => {
    const { unmount } = render(<TestHost />)
    await waitFor(() => expect(getAppHeaderHeight()).toBe('120px'))
    unmount()
    expect(getAppHeaderHeight()).toBe('')
  })
})
