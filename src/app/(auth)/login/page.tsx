'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
    } catch {
      toast.error('Google sign-in failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.')
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
      toast.success('Magic sign-in link sent! Check your email inbox.')
      setEmail('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send magic link.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0A0A0A] text-white selection:bg-white selection:text-black">
      <main className="w-full max-w-md flex flex-col items-center gap-8 z-10">
        
        {/* Brand Header */}
        <Link href="/">
          <header className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-black font-bold text-lg group-hover:scale-105 transition-transform">
              S
            </div>
            <h1 className="text-2xl font-bold tracking-tight">StudyFlow</h1>
          </header>
        </Link>

        {/* Login Card */}
        <div className="w-full bg-[#121212] rounded-3xl border border-white/10 p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient background effect */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-400 font-medium">Sign in to continue your learning journey.</p>
          </div>

          {/* Social Auth */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-14 flex items-center justify-center gap-3 border border-white/10 bg-[#1A1A1A] rounded-xl font-bold text-white hover:bg-white hover:text-black transition-all active:scale-95 duration-200 disabled:opacity-50 relative z-10 shadow-sm"
          >
            {/* Standard Google G icon embedded via SVG */}
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" fill="currentColor" />
              </g>
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center py-2 z-10">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              or sign in with email
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Email Magic Link Signin */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-300 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative">
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
            </div>
            <button
              type="submit"
              className="w-full h-14 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 duration-200 disabled:opacity-50"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending Link...' : 'Send Magic Link'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
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
