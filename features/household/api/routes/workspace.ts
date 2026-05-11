import { NextResponse } from 'next/server'
import type { ApiResponse, Workspace } from '@/features/lib/types'
import { getWorkspace } from '@/features/lib/server/dataStore'

export async function GET(): Promise<NextResponse<ApiResponse<Workspace | null>>> {
  const workspace = getWorkspace()

  const response: ApiResponse<Workspace | null> = {
    status: 'success',
    data: workspace,
    message: 'Workspace retrieved',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
