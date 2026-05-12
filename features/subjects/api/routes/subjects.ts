import { NextResponse } from 'next/server'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { getSubjects, createSubject } from '@/features/subjects/server/service'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message: string
  timestamp: string
}

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<SubjectCourse[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined

  const subjects = getSubjects(childId)

  return NextResponse.json({
    status: 'success',
    data: subjects,
    message: 'Subjects retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  const { childId, name, category, order } = body

  if (!childId || !name?.trim() || !category) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'childId, name, and category are required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  const subject = createSubject({
    childId,
    name: name.trim(),
    category: category as SubjectCourseCategory,
    order: order !== undefined ? Number(order) : undefined,
  })

  if (!subject) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Child not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json(
    {
      status: 'success',
      data: subject,
      message: 'Subject created',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  )
}
