import { NextResponse } from 'next/server'
import { getSetupStatus } from '@/features/setup/server/service'

export async function GET(): Promise<NextResponse> {
  const data = getSetupStatus()
  return NextResponse.json({
    status: 'success',
    data,
    message: 'Setup status retrieved',
    timestamp: new Date().toISOString(),
  })
}
