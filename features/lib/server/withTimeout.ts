/**
 * Races a promise against a deadline. If the promise settles first, its
 * result/rejection passes through unchanged. If the deadline elapses first,
 * rejects with a `TimeoutError` instead of leaving the caller hanging.
 *
 * Use this to guard any await of a service that can hang instead of erroring
 * (e.g. a DB query against a host that accepts the TCP connection but never
 * completes the query) — a plain try/catch does not help against a hang.
 */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(label, ms))
    }, ms)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}
