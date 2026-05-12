import { NextRequest, NextResponse } from 'next/server'

export async function handleGetLessons(request: NextRequest) {
  // TODO: Implement GET /api/planner/lessons with week and filter params
  return NextResponse.json({ status: 'success', data: [], message: 'Lessons fetched', timestamp: new Date().toISOString() })
}

export async function handlePostLesson(request: NextRequest) {
  // TODO: Implement POST /api/planner/lessons
  return NextResponse.json({ status: 'success', data: null, message: 'Lesson created', timestamp: new Date().toISOString() })
}
