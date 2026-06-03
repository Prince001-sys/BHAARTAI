import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

// GET /api/users/profile — fetch own profile
export async function GET() {
  return withAuth(async ({ user }) => {
    return NextResponse.json({ data: user })
  })
}

// PATCH /api/users/profile — update own profile
export async function PATCH(request: Request) {
  return withAuth(async ({ user, supabase }) => {
    let body: { full_name?: string; avatar_url?: string }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const allowedFields = ['full_name', 'avatar_url']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field as keyof typeof body] !== undefined) {
        updates[field] = body[field as keyof typeof body]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('[PATCH /users/profile]', error)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  })
}
