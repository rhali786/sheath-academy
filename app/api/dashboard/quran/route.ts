import { NextResponse } from 'next/server'
import type { ApiResponse, ChartSeries, QuranSessionRequest } from '@/lib/types'
import {
  getQuranSessions,
  addQuranSession,
  getChildren,
} from '@/lib/server/dataStore'

const CHILD_COLORS: Record<string, string> = {
  adam_001: '#3b82f6',
  khadijah_001: '#ec4899',
  zayd_001: '#8b5cf6',
}

export async function GET(): Promise<NextResponse> {
  const sessions = getQuranSessions()
  const children = getChildren()

  // Build chart data: Mon-Fri sessions per child
  const chartData: ChartSeries[] = children.map(child => {
    const childSessions = sessions.filter(s => s.childId === child.id)
    const dayCount: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
    }

    // Count sessions per day of week
    childSessions.forEach(session => {
      const date = new Date(session.date)
      const dayOfWeek = date.getDay()
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayName = days[dayOfWeek]

      if (dayName && dayName !== 'Sun' && dayName !== 'Sat') {
        dayCount[dayName] = (dayCount[dayName] || 0) + 1
      }
    })

    return {
      id: child.name,
      color: CHILD_COLORS[child.id] || '#6b7280',
      data: [
        { x: 'Mon', y: dayCount['Mon'] },
        { x: 'Tue', y: dayCount['Tue'] },
        { x: 'Wed', y: dayCount['Wed'] },
        { x: 'Thu', y: dayCount['Thu'] },
        { x: 'Fri', y: dayCount['Fri'] },
      ],
    }
  })

  const response: ApiResponse<{
    sessions: typeof sessions
    chartData: ChartSeries[]
  }> = {
    status: 'success',
    data: {
      sessions,
      chartData,
    },
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
