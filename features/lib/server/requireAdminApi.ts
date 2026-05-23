import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthCtx, unauthorizedResponse } from '@/features/auth/server/context'
import { isAppAdmin } from '@/features/lib/server/appAdmin'

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

  const email = authCtx.email
  if (!email || !isAppAdmin(email)) return { ok: false, response: forbiddenResponse() }

  return { ok: true, email }
}
