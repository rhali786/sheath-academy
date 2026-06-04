import { auth } from '@/features/auth/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!process.env.AUTH_SECRET) {
    console.error('[middleware] AUTH_SECRET is not set — redirecting all requests to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const path = req.nextUrl.pathname

  // Landing page is public; authenticated visitors are sent straight to their dashboard.
  if (path === '/') {
    if (req.auth) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!req.auth) {
    const login = new URL('/login', req.url)
    const returnPath = req.nextUrl.pathname + req.nextUrl.search
    if (returnPath && returnPath !== '/login') {
      login.searchParams.set('callbackUrl', returnPath)
    }
    return NextResponse.redirect(login)
  }
})

export const config = {
  // Pages only — feature APIs use app/api/[...slug]/route.ts (401 JSON), not login redirect.
  matcher: [
    '/((?!api|login|signup|forgot-password|reset-password|about|product-validation|worklog|_next/static|_next/image|favicon\\.ico).*)',
  ],
}
