'use client'

import { useState, useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase/client'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth'

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      toast.error('Authentication failed. Please check your configuration.')
    }
  }, [searchParams])

  // Establish Supabase session after Firebase Login
  const establishSession = async (idToken: string) => {
    const res = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || 'Failed to establish secure session')
    }

    // Fallback: Manually set the cookie on the client side to guarantee it exists
    if (data.customToken) {
      const isSecure = window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `sb-custom-jwt=${data.customToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${isSecure}`
    }
  }

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast.error('Firebase is not initialized. Check your environment variables.')
      return
    }
    setIsLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken(true)
      
      await establishSession(idToken)
      toast.success('Successfully signed in with Google!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) {
      toast.error('Firebase is not initialized. Check your environment variables.')
      return
    }
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    setIsLoading(true)
    try {
      if (isSignUp) {
        // Sign Up with Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const idToken = await userCredential.user.getIdToken(true)
        
        await establishSession(idToken)
        toast.success('Sign up successful!')
        router.push('/dashboard')
      } else {
        // Sign In with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const idToken = await userCredential.user.getIdToken(true)
        
        await establishSession(idToken)
        toast.success('Successfully signed in!')
        router.push('/dashboard')
      }
    } catch (err: any) {
      // Firebase throws errors like 'auth/user-not-found'
      let errorMsg = 'Authentication failed. Please try again.'
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.'
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Email is already in use.'
      } else if (err.message) {
        errorMsg = err.message
      }
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0A0A0A] text-white selection:bg-white selection:text-black">
      <main className="w-full max-w-md flex flex-col items-center gap-8 z-10">
        <Link href="/">
          <header className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-black font-bold text-lg group-hover:scale-105 transition-transform">
              S
            </div>
            <h1 className="text-2xl font-bold tracking-tight">StudyFlow</h1>
          </header>
        </Link>

        <div className="w-full bg-[#121212] rounded-3xl border border-white/10 p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-gray-400 font-medium">
              {isSignUp ? 'Sign up to start your learning journey.' : 'Sign in to continue your learning journey.'}
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-14 flex items-center justify-center gap-3 border border-white/10 bg-[#1A1A1A] rounded-xl font-bold text-white hover:bg-white hover:text-black transition-all active:scale-95 duration-200 disabled:opacity-50 relative z-10 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" fill="currentColor" />
              </g>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center py-2 z-10">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              or continue with email
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-300 ml-1 uppercase tracking-wider">Email Address</label>
                <input
                  className="w-full h-14 px-4 rounded-xl border border-white/10 focus:border-white focus:ring-1 focus:ring-white transition-all bg-[#1A1A1A] text-white outline-none font-medium"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-300 ml-1 uppercase tracking-wider">Password</label>
                <input
                  className="w-full h-14 px-4 rounded-xl border border-white/10 focus:border-white focus:ring-1 focus:ring-white transition-all bg-[#1A1A1A] text-white outline-none font-medium"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full h-14 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 duration-200 disabled:opacity-50 mt-2"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="text-center relative z-10 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setEmail('')
                setPassword('')
              }}
              className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-20 flex flex-col items-center gap-4 z-10 relative">
        <div className="flex gap-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
        </div>
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">© 2026 StudyFlow AI</p>
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
