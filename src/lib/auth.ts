import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
import { createCustomClient } from '@/lib/supabase/customClient'
import type { User } from '@/types'

export interface AuthContext {
  user: User
  supabase: ReturnType<typeof createCustomClient>
  request: NextRequest
}

/**
 * Auth middleware wrapper for API routes.
 * Verifies the user via custom JWT cookie, verifies with jwt.verify,
 * and returns user + supabase client.
 * Returns 401 if not authenticated.
 */
export async function withAuth(
  handler: (ctx: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-custom-jwt')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      throw new Error('Server configuration error: missing JWT secret')
    }

    let decodedUser: any
    try {
      decodedUser = jwt.verify(token, jwtSecret)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      )
    }

    const supabase = createCustomClient(token)

    // Fetch user profile from DB to ensure they still exist and get up-to-date role/plan
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decodedUser.sub)
      .single()

    if (dbError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404 }
      )
    }

    // Pass undefined for request since it's no longer injected, 
    // routes get the request from their own parameters.
    return await handler({ request: undefined as any, user: profile as User, supabase })
  } catch (error: any) {
    logger.error('Unexpected error in withAuth wrapper:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during authentication.' },
      { status: 500 }
    )
  }
}

/**
 * Validates a file before upload.
 * Placed here to restore original functionality lost during refactoring.
 */
export function validateFileServer(filename: string, type: string, size: number) {
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit.' }
  }
  
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
  
  // Basic validation - if it's not in the strict list, we still allow basic images/docs
  if (!allowedTypes.includes(type) && !type.startsWith('image/') && !type.startsWith('text/')) {
    return { valid: false, error: 'Unsupported file type.' }
  }

  return { valid: true }
}
