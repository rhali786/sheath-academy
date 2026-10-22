import { withTimeout, TimeoutError } from '@/features/lib/server/withTimeout'

describe('withTimeout', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('resolves with the underlying value when the promise settles before the deadline', async () => {
    const result = await withTimeout(Promise.resolve('done'), 1000, 'test-op')
    expect(result).toBe('done')
  })

  it('rejects with the original error when the promise rejects before the deadline', async () => {
    const boom = new Error('boom')
    await expect(withTimeout(Promise.reject(boom), 1000, 'test-op')).rejects.toBe(boom)
  })

  it('rejects with a TimeoutError once the deadline elapses without the promise settling', async () => {
    jest.useFakeTimers()
    const neverSettles = new Promise(() => {})

    const pending = withTimeout(neverSettles, 5000, 'test-op')
    // Attach a rejection handler synchronously so Node doesn't flag this as
    // an unhandled rejection while the timer fast-forward below is pending.
    const assertion = expect(pending).rejects.toThrow(TimeoutError)

    jest.advanceTimersByTime(5000)

    await assertion
  })

  it('includes the label in the timeout error message', async () => {
    jest.useFakeTimers()
    const neverSettles = new Promise(() => {})

    const pending = withTimeout(neverSettles, 100, 'listChangelogEntries')
    const assertion = expect(pending).rejects.toThrow(/listChangelogEntries/)

    jest.advanceTimersByTime(100)

    await assertion
  })
})
