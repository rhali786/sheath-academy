import { NextResponse } from 'next/server'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import {
  getSubject,
  updateSubject,
  archiveSubject,
  restoreSubject,
} from '@/features/subjects/server/service'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message: string
  timestamp: string
}

export async function GET(id: string): Promise<NextResponse<ApiResponse<SubjectCourse | null>>> {
  const subject = getSubject(id)

  if (!subject) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Subject not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: subject,
    message: 'Subject retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  const subject = getSubject(id)
  if (!subject) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Subject not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const body = await request.json()

  const updated = updateSubject(id, {
    name: body.name !== undefined ? body.name.trim() : undefined,
    category: body.category as SubjectCourseCategory | undefined,
    order: body.order !== undefined ? Number(body.order) : undefined,
  })

  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Subject updated',
    timestamp: new Date().toISOString(),
  })
}

export async function ARCHIVE(id: string): Promise<NextResponse> {
  const subject = getSubject(id)
  if (!subject) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Subject not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const archived = archiveSubject(id)

  return NextResponse.json({
    status: 'success',
    data: archived,
    message: 'Subject archived',
    timestamp: new Date().toISOString(),
  })
}

export async function RESTORE(id: string): Promise<NextResponse> {
  const subject = getSubject(id)
  if (!subject) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Subject not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const restored = restoreSubject(id)

  return NextResponse.json({
    status: 'success',
    data: restored,
    message: 'Subject restored',
    timestamp: new Date().toISOString(),
  })
}
