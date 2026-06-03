'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { resetUser } from '@/lib/posthog'

export default function DashboardNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()
  const { plan } = useSubscriptionStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      // 1. Sign out from Firebase
      const { auth } = await import('@/lib/firebase/client')
      if (auth) {
        await auth.signOut()
      }
      
      // 2. Clear server-side cookies
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // 3. Clear client-side cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'sb-custom-jwt=; Max-Age=0; path=/; domain=' + window.location.hostname
      }

      toast.success('Signed out successfully')
      window.location.href = '/login'
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/library', label: 'Library', icon: 'library_books' },
    { href: '/upload', label: 'Upload', icon: 'cloud_upload' },
    { href: '/pricing', label: 'Pricing', icon: 'payments' },
    { href: '/profile', label: 'Profile', icon: 'settings' },
  ]

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex justify-between items-center h-16 px-6 bg-[#000000] border-b border-white/10 sticky top-0 z-30 w-full text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black font-bold">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">StudyFlow</span>
        </div>
        <button
          className="material-symbols-outlined p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? 'close' : 'menu'}
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`h-screen w-64 fixed left-0 top-0 bg-[#000000] flex flex-col p-6 overflow-y-auto border-r border-white/10 z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="mb-10 flex justify-between items-center text-white">
          <div>
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-black font-bold">
                S
              </div>
              <span className="text-xl font-bold tracking-tight">StudyFlow</span>
            </Link>
            <p className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">
              {plan === 'pro' ? 'Pro Plan ✨' : 'Free Plan'}
            </p>
          </div>
          <button
            className="md:hidden material-symbols-outlined text-gray-400 hover:text-white cursor-pointer"
            onClick={() => setMobileOpen(false)}
          >
            close
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ease-in-out cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'text-gray-400 hover:bg-[#1A1A1A] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6">
            {user?.avatar_url ? (
              <Image
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
                src={user.avatar_url}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black text-xs font-bold">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Student'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
