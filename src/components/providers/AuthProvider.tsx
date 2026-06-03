'use client'

import { useEffect } from 'react'
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

    const fetchSupabaseProfile = async (firebaseUser: FirebaseUser, attempt = 0): Promise<void> => {
      try {
        const idToken = await firebaseUser.getIdToken()

        // Fetch profile via our API which has privileged service-role access
        // This bypasses RLS issues that occur on the client side
        const res = await fetch('/api/users/profile', {
          headers: { 'x-firebase-token': idToken }
        })

        if (res.ok) {
          const { data: profile } = await res.json()
          if (profile) {
            setUser(profile as any)
            setPlan(profile.plan_type || 'free')
            identifyUser(profile.id, {
              email: profile.email,
              plan: profile.plan_type,
              name: profile.full_name,
            })
            setLoading(false)
            return
          }
        }

        // Profile not found yet — retry with exponential backoff
        // Handles the case where the user just signed up and the bridge is still creating the DB record
        if (attempt < 5) {
          const delay = Math.min(500 * Math.pow(1.5, attempt), 3000)
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchSupabaseProfile(firebaseUser, attempt + 1)
        }

        console.warn('Could not load user profile after retries')
        setLoading(false)
      } catch (err) {
        console.warn('Profile fetch error:', err)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchSupabaseProfile(firebaseUser, attempt + 1)
        }
        setLoading(false)
      }
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
