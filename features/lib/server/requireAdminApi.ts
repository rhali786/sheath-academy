import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { assertAppAdmin, getAuthCtx, unauthorizedResponse } from '@/features/auth/server/context'

export function forbiddenResponse(): Response {
  return NextResponse.json(
    {
      status: 'error',
      data: null,
      message: 'Forbidden',
      timestamp: new Date().toISOString(),
    },
    { status: 403 },
  )
}

export async function requireAdminApi(request: Request): Promise<
  | { ok: true; email: string }
  | { ok: false; response: Response }
> {
  const authCtx = await getAuthCtx(request as NextRequest)
  if (!authCtx) return { ok: false, response: unauthorizedResponse() }

  if (!assertAppAdmin(authCtx)) return { ok: false, response: forbiddenResponse() }

  return { ok: true, email: authCtx.email! }
}
