
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const password = searchParams.get('password')
  if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email, password })
  return NextResponse.redirect(new URL('/upload', request.url))
}
  