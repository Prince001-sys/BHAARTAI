import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminAuth } from '@/lib/firebase/admin'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 })
    }

    // 1. Verify Firebase Token
    const adminAuth = getAdminAuth()
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const { uid, email, name, picture } = decodedToken

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 2. Initialize Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 3. Find or Create User in Supabase `users` table
    let { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('firebase_uid', uid)
      .single()

    // If not found by firebase_uid, try finding by email to link existing accounts
    if (!user) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        // Link account
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({ firebase_uid: uid })
          .eq('id', existingUser.id)
          .select()
          .single()
        
        if (updateError) throw updateError
        user = updatedUser
      } else {
        // Create new account
        const newId = crypto.randomUUID()
        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: newId,
            firebase_uid: uid,
            email,
            full_name: name || 'Student',
            avatar_url: picture,
            role: 'student',
            plan_type: 'free'
          })
          .select()
          .single()

        if (insertError) throw insertError
        user = newUser
      }
    }

    // 4. Mint Custom Supabase JWT
    const jwtSecret = process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      throw new Error('Missing SUPABASE_JWT_SECRET environment variable')
    }

    const payload = {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
      sub: user.id,
      email: user.email,
      role: 'authenticated'
    }

    const customToken = jwt.sign(payload, jwtSecret)

    // 5. Set Cookie for Server Components & Middleware
    const cookieStore = await cookies()
    cookieStore.set('sb-custom-jwt', customToken, {
      httpOnly: false, // Allow client JS to read it if needed
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return NextResponse.json({ success: true, user, customToken })
  } catch (error: any) {
    console.error('Firebase Auth Bridge Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
