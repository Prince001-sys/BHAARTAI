'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useStudySetStore } from '@/store/studySetStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'
import type { StudySet } from '@/types'

const FILE_TYPE_CONFIG = {
  pdf: { icon: 'description', color: 'text-white bg-white/10', badge: 'PDF' },
  image: { icon: 'image', color: 'text-white bg-white/10', badge: 'Image' },
  youtube: { icon: 'play_circle', color: 'text-white bg-white/10', badge: 'YouTube' },
  text: { icon: 'menu_book', color: 'text-white bg-white/10', badge: 'Text' },
}

export default function LibraryPage() {
  const { studySets, setStudySets, removeStudySet, searchQuery, setSearchQuery } = useStudySetStore()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<StudySet | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchStudySets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      const res = await fetch(`/api/study-sets?${params}`)
      const { data } = await res.json()
      setStudySets(data.studySets || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('Failed to load library.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, setStudySets])

  useEffect(() => {
    fetchStudySets()
  }, [fetchStudySets])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/study-sets/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      removeStudySet(deleteTarget.id)
      toast.success('Study set deleted.')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete study set.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#121212] text-white selection:bg-white selection:text-black">
      <div className="max-w-[1200px] mx-auto w-full px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">My Library</h1>
            <p className="text-gray-400 text-sm font-medium">All your uploaded study materials and generated workspaces.</p>
          </div>
          <Link href="/upload">
            <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-md">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              New Upload
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
          <input
            placeholder="Search study sets..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            className="w-full h-14 pl-12 pr-4 bg-[#1A1A1A] border border-white/10 rounded-xl focus:border-white focus:ring-1 focus:ring-white text-white transition-all outline-none"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 animate-pulse">
                <div className="h-12 w-12 bg-white/5 rounded-xl mb-4" />
                <div className="h-5 w-3/4 bg-white/5 rounded mb-3" />
                <div className="h-4 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : studySets.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-white/10 border-dashed rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
              <span className="material-symbols-outlined text-[32px] text-gray-400">menu_book</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchQuery ? 'No results found' : 'Your library is empty'}
            </h3>
            <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search keywords.' : 'Upload PDFs, Images, or YouTube links to generate an AI Workspace.'}
            </p>
            {!searchQuery && (
              <Link href="/upload">
                <button className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  Upload Now
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
              {studySets.map((set) => {
                const fileType = (set.upload as { file_type?: string } | null)?.file_type || 'text'
                const config = FILE_TYPE_CONFIG[fileType as keyof typeof FILE_TYPE_CONFIG] || FILE_TYPE_CONFIG.text
                const Icon = config.icon

                return (
                  <div
                    key={set.id}
                    className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 ${config.color}`}>
                          <span className="material-symbols-outlined text-[24px]">{Icon}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase border border-white/10 rounded-md text-gray-300">
                            {config.badge}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1.5 rounded hover:bg-white/10 transition-all text-gray-500 hover:text-white" title="Menu">
                              <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-white/10 text-white rounded-xl shadow-xl overflow-hidden p-1">
                              <Link href={`/study/${set.id}`}>
                                <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2.5 px-3 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                  <span className="font-semibold text-sm">Open Workspace</span>
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2.5 px-3 flex items-center gap-2" onClick={(e) => {
                                e.preventDefault()
                                navigator.clipboard.writeText(`${window.location.origin}/study/${set.id}`)
                                toast.success("Link copied to clipboard!")
                              }}>
                                <span className="material-symbols-outlined text-[18px]">link</span>
                                <span className="font-semibold text-sm">Copy Link</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer rounded-lg py-2.5 px-3 flex items-center gap-2 mt-1" onClick={(e) => {
                                e.preventDefault()
                                setDeleteTarget(set)
                              }}>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                <span className="font-semibold text-sm">Delete Study Set</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <Link href={`/study/${set.id}`} className="block mb-2">
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:underline decoration-white/30">
                          {set.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 font-medium">{formatRelativeTime(set.created_at)}</p>
                    </div>
                    
                    <div className="mt-6">
                      <Link href={`/study/${set.id}`}>
                        <button className="w-full py-2.5 bg-[#27272A] hover:bg-[#3F3F46] border border-white/5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                          Open Workspace
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-white/10 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-white/10 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="rounded-3xl max-w-md bg-[#121212] border border-white/10 text-white p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight mb-2">Delete Study Set?</DialogTitle>
              <DialogDescription className="text-gray-400 text-base">
                This will permanently delete &quot;<span className="text-white font-medium">{deleteTarget?.title}</span>&quot; and all its generated notes, flashcards, and quizzes. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
