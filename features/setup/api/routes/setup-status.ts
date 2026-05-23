import { NextResponse } from 'next/server'
import { getSetupStatus } from '@/features/setup/server/service'
import { getHouseholdContext } from '@/features/lib/server/tenant'

export async function GET(): Promise<NextResponse> {
  const { householdId } = await getHouseholdContext()
  const data = await getSetupStatus(householdId)
  return NextResponse.json({
    status: 'success',
    data,
    message: 'Setup status retrieved',
    timestamp: new Date().toISOString(),
  })
}
