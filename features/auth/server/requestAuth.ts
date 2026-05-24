import { AsyncLocalStorage } from 'node:async_hooks'
import type { AuthCtx } from './context'

const authCtxStorage = new AsyncLocalStorage<AuthCtx>()

/** Runs a handler with auth context resolved once at the API dispatcher. */
export async function runWithAuthCtx<T>(ctx: AuthCtx, fn: () => Promise<T>): Promise<T> {
  return authCtxStorage.run(ctx, fn)
}

/** Returns auth context for the current API request (set by `[...slug]/route.ts`). */
export function getRequestAuthCtx(): AuthCtx {
  const ctx = authCtxStorage.getStore()
  if (!ctx) {
    throw new Error('Request auth context is not available — handler called outside API dispatch')
  }
  return ctx
}

/** Returns request-scoped auth when inside API dispatch; undefined otherwise. */
export function tryGetRequestAuthCtx(): AuthCtx | undefined {
  return authCtxStorage.getStore()
}
