import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import {
  createResource,
  listResources,
  getResource,
  updateVerificationStatus,
  calculatePace,
  generateLessons,
} from '@/features/resources/server/service'
import type { PaceInput, GenerateLessonsInput } from '@/features/resources/types'

export async function handleListResources(): Promise<NextResponse> {
  const { householdId } = getRequestAuthCtx()
  return NextResponse.json({
    status: 'success',
    data: await listResources(householdId),
    message: 'OK',
    timestamp: new Date().toISOString(),
  })
}

export async function handleCreateResource(request: Request): Promise<NextResponse> {
  const { householdId } = getRequestAuthCtx()
  const body = await request.json()
  if (!body.title || !body.resourceType) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'title and resourceType are required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }
  const resource = await createResource(householdId, body)
  return NextResponse.json({
    status: 'success',
    data: resource,
    message: 'Created',
    timestamp: new Date().toISOString(),
  }, { status: 201 })
}

export async function handleGetResource(id: string): Promise<NextResponse> {
  const { householdId } = getRequestAuthCtx()
  const resource = await getResource(id, householdId)
  if (!resource) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: resource,
    message: 'OK',
    timestamp: new Date().toISOString(),
  })
}

export async function handleUpdateVerification(id: string, request: Request): Promise<NextResponse> {
  const { householdId } = getRequestAuthCtx()
  const body = await request.json()
  const updated = await updateVerificationStatus(id, householdId, body.verificationStatus)
  if (!updated) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Updated',
    timestamp: new Date().toISOString(),
  })
}

export async function handleCalculatePace(request: Request): Promise<NextResponse> {
  const body = await request.json() as PaceInput
  const result = calculatePace(body)
  return NextResponse.json({
    status: 'success',
    data: result,
    message: 'OK',
    timestamp: new Date().toISOString(),
  })
}

export async function handleGenerateLessons(request: Request): Promise<NextResponse> {
  const body = await request.json() as GenerateLessonsInput
  const lessons = generateLessons(body)
  return NextResponse.json({
    status: 'success',
    data: lessons,
    message: 'OK',
    timestamp: new Date().toISOString(),
  })
}
