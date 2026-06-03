import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getAdminAuth } from '@/lib/firebase/admin'
import { createServiceClient } from '@/lib/supabase/middleware'

// GET /api/users/profile — fetch own profile
// Supports two auth modes:
// 1. Standard: uses sb-custom-jwt cookie (via withAuth)
// 2. Firebase token: uses x-firebase-token header (used by AuthProvider on page load)
export async function GET(request: Request) {
  // Check for Firebase token header first (used by AuthProvider)
  const firebaseToken = request.headers.get('x-firebase-token')
  
  if (firebaseToken) {
    try {
      const adminAuth = getAdminAuth()
      const decoded = await adminAuth.verifyIdToken(firebaseToken)
      const serviceClient = createServiceClient()
      
      const { data: user, error } = await serviceClient
        .from('users')
        .select('*')
        .eq('firebase_uid', decoded.uid)
        .single()
      
      if (error || !user) {
        return NextResponse.json({ data: null }, { status: 404 })
      }
      
      return NextResponse.json({ data: user })
    } catch (err) {
      logger.error('[GET /users/profile firebase]', err)
      return NextResponse.json({ data: null }, { status: 401 })
    }
  }

  // Standard cookie-based auth
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
