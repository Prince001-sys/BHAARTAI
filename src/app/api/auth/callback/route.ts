import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    // Auth failed — redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  } catch (error) {
    logger.error('Callback Route Error', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }
}
