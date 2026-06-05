import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { getUnreadCount } from '@/features/messaging/server/service'
import { ok } from '../responseHelpers'

export async function GET() {
  const auth = getRequestAuthCtx()
  const count = await getUnreadCount(auth.userId)
  return ok({ count })
}
