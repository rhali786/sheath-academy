import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { guardOwnership, assertSessionOwnership } from '@/features/auth/server/routeOwnership'
import type { ApiResponse } from '@/features/lib/types'
import {
  createSession,
  getActiveSession,
  listSessions,
  transitionSession,
  SessionNotFoundError,
  InvalidTransitionError,
} from '@/features/learning-time/server/service'
import { isSessionAction, isTimeChannelType, type LearningTimeSession } from '@/features/learning-time/types'

function errorResponse(message: string, status: number): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ status: 'error', data: null, message, timestamp: new Date().toISOString() }, { status })
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<LearningTimeSession | null>>> {
  const body = await request.json()
  const { learnerId, subjectId, lessonTaskId, timeChannelType, targetMinutes, scheduledStart, scheduledEnd } = body

  if (!learnerId || !timeChannelType) {
    return errorResponse('learnerId and timeChannelType are required', 400)
  }
  if (!isTimeChannelType(timeChannelType)) {
    return errorResponse('Invalid timeChannelType', 400)
  }

  return guardOwnership(async () => {
    await assertSessionOwnership('learner', learnerId)
    const { householdId } = getRequestAuthCtx()
    try {
      const session = await createSession(householdId, {
        learnerId,
        subjectId,
        lessonTaskId,
        timeChannelType,
        targetMinutes,
        scheduledStart,
        scheduledEnd,
      })
      return NextResponse.json(
        { status: 'success', data: session, message: 'Learning time session created', timestamp: new Date().toISOString() },
        { status: 201 },
      )
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : 'Unable to create session', 400)
    }
  }) as Promise<NextResponse<ApiResponse<LearningTimeSession | null>>>
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<LearningTimeSession[]>>> {
  const { searchParams } = new URL(request.url)
  const learnerId = searchParams.get('learnerId') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  const { householdId } = getRequestAuthCtx()
  const sessions = await listSessions(householdId, { learnerId, from, to })
  return NextResponse.json({
    status: 'success',
    data: sessions,
    message: 'Learning time sessions retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function GET_ACTIVE(request: Request): Promise<NextResponse<ApiResponse<LearningTimeSession | null>>> {
  const { searchParams } = new URL(request.url)
  const learnerId = searchParams.get('learnerId')

  if (!learnerId) {
    return errorResponse('learnerId is required', 400)
  }

  const { householdId } = getRequestAuthCtx()
  const session = await getActiveSession(householdId, learnerId)
  return NextResponse.json({
    status: 'success',
    data: session,
    message: 'Active learning time session retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<LearningTimeSession | null>>> {
  const { id } = await params
  const body = await request.json()
  const { action, outcome, notes } = body

  if (typeof action !== 'string' || !isSessionAction(action)) {
    return errorResponse('Invalid or missing action', 400)
  }

  const { householdId } = getRequestAuthCtx()
  try {
    const session = await transitionSession(id, householdId, { action, outcome, notes })
    return NextResponse.json({
      status: 'success',
      data: session,
      message: 'Learning time session updated',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    if (err instanceof SessionNotFoundError) {
      return errorResponse('Session not found', 404)
    }
    if (err instanceof InvalidTransitionError) {
      return errorResponse(err.message, 400)
    }
    throw err
  }
}
