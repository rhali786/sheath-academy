import { NextResponse } from 'next/server'

export async function GET() {
  const response = {
    status: 'healthy',
    service: 'Sheath Academy Dashboard API',
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response)
}

