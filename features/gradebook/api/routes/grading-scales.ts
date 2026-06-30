import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { GradingScale } from '@/features/gradebook/types'
import {
  listGradingScales,
  createGradingScale,
  updateGradingScale,
  deleteGradingScale,
} from '@/features/gradebook/server/repository'

export async function GET(_request: Request): Promise<NextResponse<ApiResponse<GradingScale[]>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const scales = await listGradingScales(householdId)
    return NextResponse.json({ status: 'success', data: scales, message: 'Grading scales retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: [], message: 'Failed to retrieve grading scales', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<GradingScale | null>>> {
  const body = await request.json()
  const { name, bands } = body
  if (!name || !Array.isArray(bands)) {
    return NextResponse.json({ status: 'error', data: null, message: 'name and bands[] are required', timestamp: new Date().toISOString() }, { status: 400 })
  }
  try {
    const { householdId } = getRequestAuthCtx()
    const scale = await createGradingScale(householdId, { name, bands })
    return NextResponse.json({ status: 'success', data: scale, message: 'Grading scale created', timestamp: new Date().toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Failed to create grading scale', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function PATCH(id: string, request: Request): Promise<NextResponse<ApiResponse<GradingScale | null>>> {
  const body = await request.json()
  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateGradingScale(id, householdId, { name: body.name, bands: body.bands })
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Grading scale not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: updated, message: 'Grading scale updated', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Grading scale not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await deleteGradingScale(id, householdId)
    if (!removed) return NextResponse.json({ status: 'error', data: null, message: 'Grading scale not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Grading scale deleted', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Grading scale not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}
