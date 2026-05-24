import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import { getQuranSummary, type QuranSummary } from '@/features/quran/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<QuranSummary>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  try {
    const { householdId } = getRequestAuthCtx()
    const summary = await getQuranSummary(householdId, { childId, startDate, endDate })
    return NextResponse.json({ status: 'success', data: summary, message: 'Quran summary retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null as unknown as QuranSummary, message: 'Failed to load quran summary', timestamp: new Date().toISOString() }, { status: 500 })
  }
}
