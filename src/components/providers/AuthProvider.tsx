'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { identifyUser } from '@/lib/posthog'
import { auth } from '@/lib/firebase/client'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()
  const { setPlan } = useSubscriptionStore()

  useEffect(() => {
    // First check: if we have an sb-custom-jwt cookie, fetch the profile immediately
    // This handles the case where the user just logged in via window.location.replace
    const existingToken = getCookie('sb-custom-jwt')
    
    const fetchProfileByJWT = async () => {
      try {
        const res = await fetch('/api/users/profile')
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
            return true
          }
        }
      } catch {}
      return false
    }

    const fetchProfileByFirebase = async (firebaseUser: FirebaseUser, attempt = 0): Promise<void> => {
      try {
        const idToken = await firebaseUser.getIdToken()
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

        if (attempt < 5) {
          const delay = Math.min(500 * Math.pow(1.5, attempt), 3000)
          await new Promise(resolve => setTimeout(resolve, delay))
          return fetchProfileByFirebase(firebaseUser, attempt + 1)
        }

        console.warn('Could not load user profile after retries')
        setLoading(false)
      } catch (err) {
        console.warn('Profile fetch error:', err)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return fetchProfileByFirebase(firebaseUser, attempt + 1)
        }
        setLoading(false)
      }
    }

    // If we have a JWT cookie, try to fetch the profile immediately before Firebase initializes
    if (existingToken) {
      fetchProfileByJWT().then(success => {
        if (success) return // Profile loaded from cookie, done!
        
        // Cookie exists but profile fetch failed — fall back to Firebase
        if (!auth) { setLoading(false); return }
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            await fetchProfileByFirebase(firebaseUser)
          } else {
            setUser(null); setPlan('free'); setLoading(false)
          }
        })
        return () => unsubscribe()
      })
    } else {
      // No cookie — use Firebase auth state
      if (!auth) { setLoading(false); return }
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          await fetchProfileByFirebase(firebaseUser)
        } else {
          setUser(null)
          setPlan('free')
          setLoading(false)
        }
      })

      return () => unsubscribe()
    }
  }, [setUser, setLoading, setPlan])

  return <>{children}</>
}
