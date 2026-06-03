import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Auth protection is handled at the page/component level via AuthProvider and useAuthStore.
  // The middleware simply passes all requests through to avoid cookie timing issues
  // that occur on Vercel Edge where server-side cookie checks run before client JS executes.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/payments/webhook).*)',
  ],
}
