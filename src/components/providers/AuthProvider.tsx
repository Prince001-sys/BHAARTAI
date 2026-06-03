'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { identifyUser } from '@/lib/posthog'
import { auth } from '@/lib/firebase/client'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()
  const { setPlan } = useSubscriptionStore()

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const fetchSupabaseProfile = async (firebaseUser: FirebaseUser) => {
      // Small delay to ensure cookie is written by establishSession during initial login
      await new Promise(resolve => setTimeout(resolve, 500))

      const supabase = createClient()
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUser.uid)
        .single()

      if (profile) {
        setUser(profile as any)
        setPlan(profile.plan_type || 'free')
        identifyUser(profile.id, {
          email: profile.email,
          plan: profile.plan_type,
          name: profile.full_name,
        })
      } else {
        // If profile isn't found immediately, the login flow's establishSession might still be running.
        // login/page.tsx will handle the redirect once establishSession finishes.
        console.warn('Profile not yet available in Supabase')
      }
      setLoading(false)
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchSupabaseProfile(firebaseUser)
      } else {
        setUser(null)
        setPlan('free')
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [setUser, setLoading, setPlan])

  return <>{children}</>
}
