import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { EvidenceItem } from '@/features/portfolio/types'
import { listEvidenceItems, createEvidenceItem } from '@/features/portfolio/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<EvidenceItem[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const subjectId = url.searchParams.get('subjectId') ?? undefined

  const items = listEvidenceItems({ childId, subjectId })
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json({
    status: 'success',
    data: sorted,
    message: 'Evidence items retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<EvidenceItem | null>>> {
  const body = await request.json()
  const { item, errors } = createEvidenceItem(body)

  if (errors.length > 0) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: errors.map(e => e.message).join('; '),
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      status: 'success',
      data: item,
      message: 'Evidence item created',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  )
}
