import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { EvidenceItem, EvidenceType } from '@/features/portfolio/types'
import { listEvidenceItems, createEvidenceItem } from '@/features/portfolio/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<EvidenceItem[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const subjectId = url.searchParams.get('subjectId') ?? undefined
  const lessonTaskId = url.searchParams.get('lessonTaskId') ?? undefined
  const type = (url.searchParams.get('type') ?? undefined) as EvidenceType | undefined
  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined

  const items = listEvidenceItems({ childId, subjectId, lessonTaskId, type, startDate, endDate })

  return NextResponse.json({
    status: 'success',
    data: items,
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
