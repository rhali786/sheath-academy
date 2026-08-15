import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeDefinition } from '@/features/badges/types'
import { listBadgeDefinitions, createBadgeDefinition } from '@/features/badges/server/repository'

export async function GET(
  _request: Request,
): Promise<NextResponse<ApiResponse<BadgeDefinition[]>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const definitions = await listBadgeDefinitions(householdId)
    return NextResponse.json({
      status: 'success',
      data: definitions,
      message: 'Badge definitions retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: [], message: 'Failed to retrieve badge definitions', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<BadgeDefinition | null>>> {
  const body = await request.json()
  const { title, description, criteria, emblemKey, imageUrl, gradeBands, verificationRequirement, visibility, enabled } = body

  if (!title || !description || !criteria || !emblemKey) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'title, description, criteria, and emblemKey are required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const definition = await createBadgeDefinition(householdId, {
      title, description, criteria, emblemKey, imageUrl,
      gradeBands, verificationRequirement, visibility, enabled,
    })
    return NextResponse.json(
      { status: 'success', data: definition, message: 'Badge created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to create badge', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}
