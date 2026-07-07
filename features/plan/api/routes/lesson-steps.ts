import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonStep } from '@/features/plan/types'
import {
  listLessonSteps,
  createLessonStep,
  updateLessonStep,
  deleteLessonStep,
} from '@/features/plan/server/repository'
import type { LessonStepRow } from '@/features/plan/server/repository'
import { guardOwnership, assertSessionOwnership } from '@/features/auth/server/routeOwnership'

const VALID_TYPES = ['instruction', 'reading', 'practice', 'discussion', 'assessment']

function rowToStep(r: LessonStepRow): LessonStep {
  return {
    id: r.id,
    lessonTaskId: r.lessonTaskId,
    order: r.order,
    stepText: r.stepText,
    type: r.type,
    doneCriteria: r.doneCriteria ?? null,
    quantity: r.quantity ?? null,
  }
}

export async function GET(lessonTaskId: string): Promise<NextResponse<ApiResponse<LessonStep[]>>> {
  return guardOwnership(async () => {
    // Steps have no householdId — ownership is inherited via the parent lesson.
    await assertSessionOwnership('lesson', lessonTaskId)
    const rows = await listLessonSteps(lessonTaskId)
    return NextResponse.json({
      status: 'success',
      data: rows.map(rowToStep),
      message: 'Lesson steps retrieved',
      timestamp: new Date().toISOString(),
    })
  }) as Promise<NextResponse<ApiResponse<LessonStep[]>>>
}

export async function POST(
  lessonTaskId: string,
  request: Request,
): Promise<NextResponse<ApiResponse<LessonStep | null>>> {
  const body = await request.json()
  const { stepText, type, order, doneCriteria, quantity } = body

  if (!stepText || typeof stepText !== 'string' || !stepText.trim()) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'stepText is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Invalid step type', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  return guardOwnership(async () => {
    await assertSessionOwnership('lesson', lessonTaskId)
    // Default order to the end of the current list when not supplied.
    const resolvedOrder = typeof order === 'number'
      ? order
      : (await listLessonSteps(lessonTaskId)).length
    const row = await createLessonStep({
      lessonTaskId,
      order: resolvedOrder,
      stepText: stepText.trim(),
      type,
      doneCriteria,
      quantity,
    })
    return NextResponse.json(
      { status: 'success', data: rowToStep(row), message: 'Lesson step created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  }) as Promise<NextResponse<ApiResponse<LessonStep | null>>>
}

export async function PATCH(
  lessonTaskId: string,
  stepId: string,
  request: Request,
): Promise<NextResponse<ApiResponse<LessonStep | null>>> {
  const body = await request.json()
  const { stepText, type, order, doneCriteria, quantity } = body

  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Invalid step type', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  return guardOwnership(async () => {
    await assertSessionOwnership('lesson', lessonTaskId)
    const updated = await updateLessonStep(stepId, lessonTaskId, { stepText, type, order, doneCriteria, quantity })
    if (!updated) {
      return NextResponse.json({ status: 'error', data: null, message: 'Lesson step not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: rowToStep(updated), message: 'Lesson step updated', timestamp: new Date().toISOString() })
  }) as Promise<NextResponse<ApiResponse<LessonStep | null>>>
}

export async function DELETE(
  lessonTaskId: string,
  stepId: string,
): Promise<NextResponse<ApiResponse<null>>> {
  return guardOwnership(async () => {
    await assertSessionOwnership('lesson', lessonTaskId)
    const removed = await deleteLessonStep(stepId, lessonTaskId)
    if (!removed) {
      return NextResponse.json({ status: 'error', data: null, message: 'Lesson step not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: null, message: 'Lesson step deleted', timestamp: new Date().toISOString() })
  }) as Promise<NextResponse<ApiResponse<null>>>
}
