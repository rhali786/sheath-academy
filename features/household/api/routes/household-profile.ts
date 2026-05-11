import { NextResponse } from 'next/server'
import type { ApiResponse, HouseholdProfile } from '@/features/lib/types'
import { getHouseholdProfile } from '@/features/lib/server/dataStore'

export async function GET(): Promise<NextResponse<ApiResponse<HouseholdProfile | null>>> {
  const profile = getHouseholdProfile()

  const response: ApiResponse<HouseholdProfile | null> = {
    status: 'success',
    data: profile,
    message: 'Household profile retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
