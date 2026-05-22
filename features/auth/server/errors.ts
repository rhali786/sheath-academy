/** Thrown when an entity is missing or belongs to another household (maps to HTTP 404). */
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export function isNotFoundError(e: unknown): e is NotFoundError {
  return e instanceof NotFoundError
}
