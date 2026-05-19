import { NextResponse } from 'next/server'
import {
  createResource,
  listResources,
  getResource,
  updateVerificationStatus,
  calculatePace,
  generateLessons,
} from '@/features/resources/server/service'
import type { PaceInput, GenerateLessonsInput } from '@/features/resources/types'

export async function handleListResources(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const workspaceId = url.searchParams.get('workspaceId') ?? undefined
  return NextResponse.json({
    status: 'success',
    data: listResources(workspaceId),
    message: 'OK',
    timestamp: new Date().toISOString(),
  })
}

export async function handleCreateResource(request: Request): Promise<NextResponse> {
  const body = await request.json()
  if (!body.workspaceId || !body.title || !body.resourceType) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'workspaceId, title, resourceType are required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }
  const resource = createResource(body)
  return NextResponse.json({
    status: 'success',
    data: resource,
    message: 'Created',
    timestamp: new Date().toISOString(),
  }, { status: 201 })
}

export async function handleGetResource(id: string): Promise<NextResponse> {
  const resource = getResource(id)
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
  const body = await request.json()
  const updated = updateVerificationStatus(id, body.verificationStatus)
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
