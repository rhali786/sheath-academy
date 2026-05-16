import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { EvidenceItem } from '@/features/portfolio/types'
import {
  getEvidenceItemById,
  updateEvidenceItem,
  deleteEvidenceItem,
} from '@/features/portfolio/server/service'

export async function GET(id: string): Promise<NextResponse<ApiResponse<EvidenceItem | null>>> {
  const item = getEvidenceItemById(id)
  if (!item) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Evidence item not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: item,
    message: 'Evidence item retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PUT(
  id: string,
  request: Request
): Promise<NextResponse<ApiResponse<EvidenceItem | null>>> {
  const body = await request.json()
  const { item, errors } = updateEvidenceItem(id, body)

  if (errors.length > 0) {
    const isNotFound = errors.some(e => e.field === 'id')
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: errors.map(e => e.message).join('; '),
        timestamp: new Date().toISOString(),
      },
      { status: isNotFound ? 404 : 400 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: item,
    message: 'Evidence item updated',
    timestamp: new Date().toISOString(),
  })
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  const removed = deleteEvidenceItem(id)
  if (!removed) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Evidence item not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'Evidence item deleted',
    timestamp: new Date().toISOString(),
  })
}
