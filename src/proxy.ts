import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

const PUBLIC_PREFIXES = ['/login', '/r/', '/api/images/', '/icons/']
const PUBLIC_FILES = ['/sw.js', '/manifest.json']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  const isPublic =
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || PUBLIC_FILES.includes(pathname)

  if (!authenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (authenticated && (pathname === '/login' || pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/recipes'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
