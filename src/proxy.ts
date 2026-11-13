import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Kiểm tra lạc quan: không có cookie phiên → chuyển ngay tới /login.
 * Đây chỉ là lối tắt cho trải nghiệm; quyền thật được kiểm tra lại trong trang và API.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  const login = new URL('/login', request.url)
  login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
