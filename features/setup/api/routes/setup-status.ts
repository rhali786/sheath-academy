import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import { getSetupStatus } from '@/features/setup/server/service'

export async function GET(): Promise<NextResponse> {
  const { householdId } = getRequestAuthCtx()
  const data = await getSetupStatus(householdId)
  return NextResponse.json({
    status: 'success',
    data,
    message: 'Setup status retrieved',
    timestamp: new Date().toISOString(),
  })
}
