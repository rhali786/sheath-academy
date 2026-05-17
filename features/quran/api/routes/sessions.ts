import { NextResponse } from 'next/server'
import type { ApiResponse, ChartSeries, QuranSessionRequest } from '@/features/lib/types'
import { getQuranSessions, addQuranSession } from '@/features/quran/server/service'
import { getStudentProfiles } from '@/features/children/server/service'

const CHILD_COLORS: Record<string, string> = {
  student_seed_adam_001: '#3b82f6',
  student_seed_khadijah_001: '#ec4899',
  student_seed_zayd_001: '#8b5cf6',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function buildChartData(sessions: ReturnType<typeof getQuranSessions>, childId: string, name: string): ChartSeries {
  const dayCount: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 }
  sessions.filter(s => s.childId === childId).forEach(session => {
    const dayName = DAYS[new Date(session.date).getDay()]
    if (dayName && dayName !== 'Sun' && dayName !== 'Sat') {
      dayCount[dayName] = (dayCount[dayName] || 0) + 1
    }
  })
  return {
    id: name,
    color: CHILD_COLORS[childId] || '#6b7280',
    data: [
      { x: 'Mon', y: dayCount['Mon'] },
      { x: 'Tue', y: dayCount['Tue'] },
      { x: 'Wed', y: dayCount['Wed'] },
      { x: 'Thu', y: dayCount['Thu'] },
      { x: 'Fri', y: dayCount['Fri'] },
    ],
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined

  const allSessions = getQuranSessions()
  const activeProfiles = getStudentProfiles().filter(p => p.isActive)

  const profilesToShow = childId
    ? activeProfiles.filter(p => p.id === childId)
    : activeProfiles

  const chartData: ChartSeries[] = profilesToShow.map(p =>
    buildChartData(allSessions, p.id, p.name)
  )

  const sessions = getQuranSessions(childId)
    .filter(s => !childId ? activeProfiles.some(p => p.id === s.childId) : true)

  const response: ApiResponse<{ sessions: typeof sessions; chartData: ChartSeries[] }> = {
    status: 'success',
    data: { sessions, chartData },
    message: 'Quran sessions retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}

export async function POST(request: Request): Promise<NextResponse> {
  const sessionData = (await request.json()) as QuranSessionRequest

  const newSession = addQuranSession(sessionData)

  const response: ApiResponse<typeof newSession> = {
    status: 'success',
    data: newSession,
    message: 'Quran session added',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response, { status: 201 })
}
