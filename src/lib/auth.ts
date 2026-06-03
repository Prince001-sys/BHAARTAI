import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types'

export interface AuthContext {
  user: User
  supabase: Awaited<ReturnType<typeof createClient>>
}

/**
 * Auth middleware wrapper for API routes.
 * Verifies the user is authenticated and returns user + supabase client.
 * Returns 401 if not authenticated.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function withAuth(
  handler: (ctx: AuthContext) => Promise<NextResponse<any>>
): Promise<NextResponse<any>> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      ) as NextResponse<{ error: string }>
    }

    // Fetch user profile
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !user) {
      console.warn(`[withAuth] Profile missing for user ${authUser.id}. Re-creating profile...`)
      // Try to create profile
      const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Student'
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          phone: authUser.phone,
          full_name: fullName,
          avatar_url: authUser.user_metadata?.avatar_url,
          plan_type: 'free',
          role: 'student'
        })
        .select()
        .single()

      if (createError || !newProfile) {
        console.error('[withAuth] Failed to auto-create user profile:', createError)
        return NextResponse.json(
          { error: 'User profile not found. Please log out and sign in again.' },
          { status: 404 }
        ) as NextResponse<{ error: string }>
      }
      user = newProfile
    }

    return handler({ user, supabase })
  } catch (error) {
    console.error('[withAuth] Error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    ) as NextResponse<{ error: string }>
  }
}

/**
 * Validates file type and size on server side.
 * Extra safety beyond client-side validation.
 */
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const BLOCKED_EXTENSIONS = ['.exe', '.zip', '.apk', '.bat', '.dll', '.sh', '.cmd', '.js', '.php']
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export function validateFileServer(
  filename: string,
  mimeType: string,
  size: number
): { valid: boolean; error?: string } {
  // Check extension
  const ext = '.' + filename.split('.').pop()?.toLowerCase()
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Unsupported file type. Please upload PDF, JPG, or PNG.' }
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Unsupported file type. Please upload PDF, JPG, or PNG.' }
  }

  // Check size
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 25MB.' }
  }

  if (size === 0) {
    return { valid: false, error: 'File is empty. Please select a valid file.' }
  }

  return { valid: true }
}
