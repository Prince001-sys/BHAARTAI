'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { useSubscriptionStore } from '@/store/subscriptionStore'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const { plan } = useSubscriptionStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [saving, setSaving] = useState(false)

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S'

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setUser(data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#121212] text-white selection:bg-white selection:text-black">
      <div className="max-w-[768px] mx-auto w-full px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile Settings</h1>
          <p className="text-gray-400 text-sm font-medium">Manage your personal information and account preferences.</p>
        </div>

        <div className="space-y-8">
          {/* Avatar Card */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 flex items-center gap-6 shadow-sm">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-black text-2xl font-black border border-white/10 shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">{user?.full_name || 'Student'}</h2>
              <p className="text-sm text-gray-400 font-medium mb-3">{user?.email}</p>
              <div className="flex items-center gap-2">
                {plan === 'pro' ? (
                  <span className="px-3 py-1 bg-white text-black text-[10px] font-black tracking-wider uppercase rounded border border-white">
                    PRO Member
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-white/5 text-gray-300 text-[10px] font-bold tracking-wider uppercase rounded border border-white/10">
                    Free Plan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6">Edit Information</h3>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-14 px-4 bg-[#121212] border border-white/10 rounded-xl focus:border-white focus:ring-1 focus:ring-white text-white transition-all outline-none"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Email Address
                </label>
                <input
                  value={user?.email || ''}
                  disabled
                  className="w-full h-14 px-4 bg-black/50 border border-transparent rounded-xl text-gray-500 cursor-not-allowed outline-none"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Email cannot be changed
                </p>
              </div>

              {user?.phone && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                    <span className="material-symbols-outlined text-[18px]">phone</span>
                    Phone Number
                  </label>
                  <input
                    value={user.phone}
                    disabled
                    className="w-full h-14 px-4 bg-black/50 border border-transparent rounded-xl text-gray-500 cursor-not-allowed outline-none"
                  />
                </div>
              )}
              
              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || fullName === user?.full_name}
                  className="w-full h-14 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined">save</span>
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6">Account Details</h3>
            <div className="space-y-4 text-sm bg-[#121212] p-5 rounded-xl border border-white/5">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-gray-400 font-medium">Member Since</span>
                <span className="text-white font-bold">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400 font-medium">Current Plan</span>
                <span className="text-white font-bold capitalize">{plan}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
