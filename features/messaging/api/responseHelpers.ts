import { NextResponse } from 'next/server'

export function ok<T>(data: T, message = ''): NextResponse {
  return NextResponse.json({
    status: 'success',
    data,
    message,
    timestamp: new Date().toISOString(),
  })
}

export function err(status: number, message: string): NextResponse {
  return NextResponse.json(
    { status: 'error', data: null, message, timestamp: new Date().toISOString() },
    { status },
  )
}
