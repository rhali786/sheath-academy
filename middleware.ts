import { auth } from '@/features/auth/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!process.env.AUTH_SECRET) {
    console.error('[middleware] AUTH_SECRET is not set — redirecting all requests to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!api/auth|api/health|login|about|worklog|_next/static|_next/image|favicon\.ico).*)',
  ],
}
