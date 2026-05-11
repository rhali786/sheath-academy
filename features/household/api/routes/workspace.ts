import { NextResponse } from 'next/server'
import type { ApiResponse, Workspace } from '@/features/lib/types'
import { getWorkspace, createWorkspace, createHouseholdProfile } from '@/features/lib/server/dataStore'

export async function GET(): Promise<NextResponse<ApiResponse<Workspace | null>>> {
  const workspace = getWorkspace()
  return NextResponse.json({
    status: 'success',
    data: workspace,
    message: 'Workspace retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()
  const familyName = (body?.familyName ?? '').trim()
  if (!familyName) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'familyName is required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }
  const workspace = createWorkspace(familyName)
  const profile = createHouseholdProfile(workspace.id, familyName)
  return NextResponse.json({
    status: 'success',
    data: { workspace, profile },
    message: 'Household created',
    timestamp: new Date().toISOString(),
  })
}
