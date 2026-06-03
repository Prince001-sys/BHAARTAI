
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const password = searchParams.get('password')
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    const supabase = await createClient()
    await supabase.auth.signInWithPassword({ email, password })
    return NextResponse.redirect(new URL('/upload', request.url))
  } catch (error) {
    logger.error('Test Login Route Error', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
  