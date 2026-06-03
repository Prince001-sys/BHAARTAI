'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { identifyUser } from '@/lib/posthog'
import type { User } from '@/types'

async function fetchOrCreateProfile(supabase: ReturnType<typeof createClient>, authUser: { id: string; email?: string; phone?: string; user_metadata?: Record<string, unknown> }): Promise<User | null> {
  let { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile) {
    const fullName = (authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Student') as string
    const { data: newProfile } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        phone: authUser.phone,
        full_name: fullName,
        avatar_url: authUser.user_metadata?.avatar_url as string | undefined,
        plan_type: 'free',
        role: 'student',
      })
      .select()
      .single()
    if (newProfile) profile = newProfile
  }

  return profile as User | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()
  const { setPlan } = useSubscriptionStore()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session — always clear first to avoid stale cache
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        // Clear any stale persisted user before setting the fresh one
        setUser(null)
        const profile = await fetchOrCreateProfile(supabase, user as any)
        if (profile) {
          setUser(profile)
          setPlan(profile.plan_type || 'free')
          identifyUser(user.id, {
            email: profile.email,
            plan: profile.plan_type,
            name: profile.full_name,
          })
        }
      } else {
        setUser(null)
        setPlan('free')
      }
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setPlan('free')
          setLoading(false)
          return
        }

        if (session?.user) {
          // Always clear stale user on new sign-in so old email never shows
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(null)
          }

          const profile = await fetchOrCreateProfile(supabase, session.user as any)
          if (profile) {
            setUser(profile)
            setPlan(profile.plan_type || 'free')
          }
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, setPlan])

  return <>{children}</>
}
