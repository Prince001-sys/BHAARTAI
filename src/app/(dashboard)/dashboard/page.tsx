'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { formatRelativeTime } from '@/lib/utils'
import type { DashboardStats } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(({ data }) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const confirm = window.confirm("Are you sure you want to delete this study set?")
    if (!confirm) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('study_sets').delete().eq('id', id)
      if (error) throw error
      
      toast.success("Study set deleted.")
      setStats(prev => prev ? { ...prev, recentStudySets: prev.recentStudySets.filter(s => s.id !== id) } : null)
    } catch {
      toast.error("Failed to delete study set.")
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const studyHours = [2.4, 3.2, 1.2, 4.8, 2.8, 0.8, 2.2]
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const maxHours = Math.max(...studyHours)

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#121212] text-white selection:bg-white selection:text-black">
      {/* Top Bar Header */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center py-8 px-8 bg-[#121212] border-b border-white/10 sticky top-0 z-10 gap-4">
        <h2 className="text-2xl font-bold tracking-tight">
          {greeting()}, {user?.full_name?.split(' ')[0] || 'Student'}
        </h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 text-gray-300 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-[16px] text-orange-400" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="text-xs font-semibold">{stats?.streakDays || 0} Day Streak</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-gray-400 hover:text-white transition-colors cursor-pointer">
              notifications
            </button>
            <Link href="/profile" className="material-symbols-outlined text-gray-400 hover:text-white transition-colors cursor-pointer">
              settings
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <div className="max-w-[1200px] w-full mx-auto p-8 space-y-12">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white shrink-0 border border-white/10">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-1">Streak</p>
              <p className="text-2xl font-bold">{stats?.streakDays || 0}</p>
            </div>
          </div>
          <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white shrink-0 border border-white/10">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_turned_in</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-1">Quiz Score</p>
              <p className="text-2xl font-bold">{stats?.averageQuizScore ? `${stats.averageQuizScore}%` : '—'}</p>
            </div>
          </div>
          <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white shrink-0 border border-white/10">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-1">Study Time</p>
              <p className="text-2xl font-bold">
                {stats?.totalMinutesStudied ? `${Math.round((stats.totalMinutesStudied / 60) * 10) / 10}h` : '0h'}
              </p>
            </div>
          </div>
          <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white shrink-0 border border-white/10">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-1">Flashcards</p>
              <p className="text-2xl font-bold">{stats?.totalFlashcardsReviewed || 0}</p>
            </div>
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section>
          <h3 className="text-lg font-bold mb-6 tracking-tight">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/upload" className="w-full">
              <button className="w-full h-14 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Upload New
              </button>
            </Link>
            <Link href="/upload" className="w-full">
              <button className="w-full h-14 bg-[#27272A] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#3F3F46] border border-white/10 transition-all cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[20px]">auto_fix</span>
                Create Set
              </button>
            </Link>
            <Link href="/library" className="w-full">
              <button className="w-full h-14 bg-[#18181B] text-white border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/5 transition-all cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[20px]">style</span>
                Review Cards
              </button>
            </Link>
            <Link href="/library" className="w-full">
              <button className="w-full h-14 bg-[#18181B] text-white border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/5 transition-all cursor-pointer shadow-sm">
                <span className="material-symbols-outlined text-[20px]">quiz</span>
                Mock Quiz
              </button>
            </Link>
          </div>
        </section>

        {/* Recent Uploads Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight mb-1">Recent Study Sets</h3>
              <p className="text-sm text-gray-400">Pick up right where you left off</p>
            </div>
            <Link href="/library" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 flex gap-6 animate-pulse">
                  <div className="w-24 h-32 bg-white/5 rounded-xl shrink-0" />
                  <div className="flex flex-col justify-between flex-1 py-2 space-y-4">
                    <div>
                      <div className="h-4 w-20 bg-white/5 rounded mb-4" />
                      <div className="h-4 w-full bg-white/5 rounded mb-2" />
                      <div className="h-4 w-2/3 bg-white/5 rounded" />
                    </div>
                    <div className="h-10 w-full bg-white/5 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : !stats?.recentStudySets || stats.recentStudySets.length === 0 ? (
            <div className="bg-[#1A1A1A] p-12 text-center rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 text-white">
                <span className="material-symbols-outlined text-3xl">cloud_upload</span>
              </div>
              <h3 className="font-semibold mb-2 text-lg">No study sets yet</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
                Upload your syllabus PDFs, notes, or YouTube lecture links and watch them transform into premium study guides.
              </p>
              <Link href="/upload">
                <button className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all cursor-pointer">
                  Upload Now
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.recentStudySets.map((set) => {
                const status = set.upload?.processing_status || 'completed'
                const fileType = set.upload?.file_type || 'text'
                
                const icons = {
                  pdf: 'description',
                  youtube: 'play_circle',
                  image: 'image',
                  text: 'menu_book'
                }
                const icon = icons[fileType as keyof typeof icons] || icons.text

                return (
                  <div key={set.id} onClick={() => status === 'completed' && router.push(`/study/${set.id}`)} className={`bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 flex gap-6 group transition-all ${status === 'completed' ? 'hover:border-white/30 hover:bg-[#202020] cursor-pointer' : ''}`}>
                    
                    {/* Visual Graphic Representation */}
                    <div className="w-24 h-32 bg-[#27272A] rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden border border-white/5">
                      <span className="material-symbols-outlined text-[32px] text-gray-500 group-hover:scale-110 transition-transform duration-300 group-hover:text-white">
                        {icon}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between flex-1 py-1 min-w-0">
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          {status === 'completed' && (
                            <span className="px-2 py-1 bg-white/10 text-white text-[10px] font-bold tracking-wide rounded-md border border-white/10">READY</span>
                          )}
                          {status === 'processing' && (
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold tracking-wide rounded-md border border-yellow-500/20 animate-pulse">PROCESSING</span>
                          )}
                          {status === 'failed' && (
                            <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold tracking-wide rounded-md border border-red-500/20">FAILED</span>
                          )}
                          
                          {/* Replaced broken three-dot menu with a direct functional delete button */}
                          <DropdownMenu>
                            <DropdownMenuTrigger className="material-symbols-outlined text-[18px] text-gray-500 hover:text-white cursor-pointer p-1 rounded hover:bg-white/5 transition-colors" title="Menu">
                              more_vert
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-white/10 text-white rounded-xl shadow-xl overflow-hidden p-1">
                              <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2.5 px-3 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); router.push(`/study/${set.id}`); }}>
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                <span className="font-semibold text-sm">Open Workspace</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2.5 px-3 flex items-center gap-2" onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(`${window.location.origin}/study/${set.id}`)
                                toast.success("Link copied to clipboard!")
                              }}>
                                <span className="material-symbols-outlined text-[18px]">link</span>
                                <span className="font-semibold text-sm">Copy Link</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer rounded-lg py-2.5 px-3 flex items-center gap-2 mt-1" onClick={(e) => handleDelete(set.id, e)}>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                <span className="font-semibold text-sm">Delete Study Set</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-white text-gray-200 transition-colors" title={set.title}>
                          {set.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-2 font-medium">{formatRelativeTime(set.created_at)}</p>
                      </div>

                      {status === 'completed' ? (
                        <div className="mt-4 text-xs font-bold text-gray-400 group-hover:text-white transition-colors flex items-center gap-1">
                          Open Workspace <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </div>
                      ) : status === 'processing' ? (
                        <div className="mt-4 text-xs font-bold text-gray-500">
                          Extracting contents...
                        </div>
                      ) : (
                        <div className="mt-4 text-xs font-bold text-red-400">
                          Failed to process document
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Activity & AI Tip Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#1A1A1A] p-6 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold tracking-wide uppercase text-gray-400">Activity (Past 7 Days)</h3>
            </div>

            <div className="h-40 flex items-end justify-between gap-4 px-2">
              {studyHours.map((hours, idx) => {
                const heightPercentage = `${Math.max(15, (hours / maxHours) * 100)}%`
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-white/10 rounded-t-sm relative group hover:bg-white transition-all duration-300 cursor-pointer"
                    style={{ height: heightPercentage }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md whitespace-nowrap z-20">
                      {hours}h
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-4 px-2 font-semibold">
              {daysOfWeek.map((day, idx) => (
                <span key={idx}>{day}</span>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl text-black relative flex flex-col justify-between overflow-hidden shadow-lg border border-transparent">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                <h3 className="font-bold text-sm uppercase tracking-wide text-gray-800">AI Tutor Tip</h3>
              </div>
              <p className="text-sm text-gray-700 mb-8 leading-relaxed font-medium">
                {stats && stats.totalStudySets > 0
                  ? `Steady progress! Spend 10 minutes reviewing flashcards or test yourself with a quick mock quiz to lock in key learning targets.`
                  : `Get started by uploading your first syllabus material. Your AI Tutor will analyze the document and build a personalized workspace.`}
              </p>
            </div>
            <div className="relative z-10">
              <Link href={stats && stats.recentStudySets?.length > 0 ? `/study/${stats.recentStudySets[0].id}` : '/upload'}>
                <button className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all cursor-pointer shadow-md">
                  {stats && stats.recentStudySets?.length > 0 ? 'Study Now' : 'Upload Material'}
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
