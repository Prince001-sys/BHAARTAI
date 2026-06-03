'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { NotesViewer } from '@/components/notes/NotesViewer'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { FlashcardViewer } from '@/components/flashcards/FlashcardViewer'
import { QuizPlayer } from '@/components/quiz/QuizPlayer'
import { YouTubePanel } from '@/components/workspace/YouTubePanel'
import type { StudySet, AiNotes, Flashcard, Upload } from '@/types'

interface StudyWorkspaceProps {
  params: Promise<{ id: string }>
}

export default function StudyWorkspacePage({ params }: StudyWorkspaceProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const { plan } = useSubscriptionStore()
  
  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [notes, setNotes] = useState<AiNotes | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false)
  const [activeTab, setActiveTab] = useState<'notes' | 'chat' | 'flashcards' | 'quiz'>('notes')

  useEffect(() => {
    loadStudySet()
  }, [id])

  const loadStudySet = async () => {
    try {
      const [ssRes, notesRes, flashRes] = await Promise.all([
        fetch(`/api/study-sets/${id}`),
        fetch(`/api/ai/notes?studySetId=${id}`),
        fetch(`/api/flashcards/generate?studySetId=${id}`),
      ])

      const { data: ss } = await ssRes.json()
      const { data: n } = await notesRes.json()
      const { data: f } = await flashRes.json()

      if (!ss) {
        router.push('/library')
        return
      }

      setStudySet(ss)
      setNotes(n)
      setFlashcards(f || [])

      const upload = ss.upload as { processing_status?: string } | null
      if (upload?.processing_status === 'completed' && !n) {
        generateNotes()
      }
    } catch {
      toast.error('Failed to load study set.')
    } finally {
      setLoading(false)
    }
  }

  const generateNotes = async () => {
    setGeneratingNotes(true)
    try {
      const res = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studySetId: id }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setNotes(data)
      toast.success('Notes generated successfully!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate notes'
      if (msg.includes('upgradeRequired') || msg.includes('limit')) {
        toast.error(msg, { action: { label: 'Upgrade', onClick: () => router.push('/pricing') } })
      } else {
        toast.error(msg)
      }
    } finally {
      setGeneratingNotes(false)
    }
  }

  const generateFlashcards = async () => {
    setGeneratingFlashcards(true)
    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studySetId: id }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      setFlashcards(data || [])
      toast.success('Flashcards generated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate flashcards')
    } finally {
      setGeneratingFlashcards(false)
    }
  }

  const upload = studySet?.upload as (Upload & { signedUrl?: string | null }) | null
  const isProcessing = upload?.processing_status === 'processing' || upload?.processing_status === 'pending'

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212] selection:bg-white selection:text-black">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-white text-[48px] animate-spin">sync</span>
          <p className="text-white font-medium">Loading AI Study Workspace...</p>
        </div>
      </div>
    )
  }

  if (!studySet) return null

  return (
    <div className="min-h-screen bg-[#121212] text-white overflow-hidden relative flex selection:bg-white selection:text-black">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col p-4 w-64 h-screen bg-[#000000] border-r border-white/10 shrink-0">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-black font-bold text-xs">
              S
            </div>
            <h1 className="font-bold text-white text-lg tracking-tight">StudyFlow</h1>
          </div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Workspace Active</p>
        </div>
        
        <Link href="/dashboard">
          <button className="w-full flex items-center justify-center gap-2 mb-6 px-4 py-3 text-white bg-[#1A1A1A] border border-white/10 rounded-xl font-bold hover:bg-white hover:text-black transition-colors cursor-pointer text-sm">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Dashboard
          </button>
        </Link>

        {/* Study Set Information Card */}
        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 mb-6 relative overflow-hidden">
          <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-sm inline-block mb-3 tracking-widest uppercase border border-white/10">
            Active Set
          </span>
          <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 leading-tight" title={studySet.title}>
            {studySet.title}
          </h3>
          <div className="h-[1px] bg-white/10 my-3" />
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Type:</span>
              <span className="font-bold text-white capitalize">{upload?.file_type || 'Unknown'}</span>
            </div>
            {upload?.original_filename && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>File:</span>
                <span className="font-bold text-white truncate max-w-[120px]" title={upload.original_filename}>
                  {upload.original_filename}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-400">
              <span>Status:</span>
              <span className={`font-bold capitalize flex items-center gap-1 ${
                upload?.processing_status === 'completed' ? 'text-green-400' :
                upload?.processing_status === 'failed' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {upload?.processing_status === 'completed' ? 'Ready' :
                 upload?.processing_status === 'failed' ? 'Failed' :
                 upload?.processing_status || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-white/20"
              src={user.avatar_url}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-grow">
            <p className="text-sm font-bold text-white truncate">{user?.full_name || 'Student'}</p>
            <p className="text-xs text-gray-500 font-medium capitalize">
              {plan === 'pro' ? 'Pro Member ✨' : 'Free Member'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-screen pl-64 overflow-hidden">
        
        {/* Side-by-Side Canvas */}
        <div className="flex-grow flex h-screen overflow-hidden">
          
          {/* Left Panel: Resource Viewer (50% Width) */}
          <div className="w-1/2 h-full flex flex-col border-r border-white/10 bg-[#0A0A0A] overflow-hidden p-6 shrink-0">
            {isProcessing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <span className="material-symbols-outlined text-[32px] text-white animate-spin">sync</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Document...</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Extracting text and generating smart components. This takes 30-60 seconds.
                </p>
              </div>
            ) : upload?.processing_status === 'failed' ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <span className="material-symbols-outlined text-[32px] text-red-500">error</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Processing Failed</h3>
                <p className="text-sm text-gray-400 max-w-sm mb-6">
                  {upload?.error_message || 'An error occurred while parsing.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!upload?.id) return
                      toast.info('Retrying...')
                      await fetch('/api/ai/extract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uploadId: upload.id }),
                      })
                      setTimeout(() => loadStudySet(), 3000)
                    }}
                    className="px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Retry Processing
                  </button>
                  <Link href="/upload">
                    <button className="px-6 py-3 border border-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/5 transition-colors">
                      Upload Another
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col overflow-hidden gap-4">
                {upload?.file_type === 'youtube' && (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <YouTubePanel upload={upload as any} studySetTitle={studySet.title} />
                )}

                {upload?.file_type === 'pdf' && (
                  <div className="w-full h-full flex flex-col bg-[#121212] rounded-xl overflow-hidden border border-white/10">
                    {upload.signedUrl ? (
                      <iframe
                         src={`${upload.signedUrl}#toolbar=0`}
                         className="w-full h-full flex-grow border-none rounded-xl"
                         title={studySet.title}
                         style={{ backgroundColor: '#121212', filter: 'invert(90%) hue-rotate(180deg)' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">
                        Loading PDF...
                      </div>
                    )}
                  </div>
                )}

                {upload?.file_type === 'image' && (
                  <div className="w-full h-full flex flex-col bg-[#121212] rounded-xl overflow-hidden border border-white/10 p-4 justify-center items-center">
                    {upload.signedUrl ? (
                      <img
                        src={upload.signedUrl}
                        alt={studySet.title}
                        className="max-w-full max-h-full object-contain rounded-lg border border-white/10"
                      />
                    ) : (
                      <div className="text-gray-500 text-sm font-bold">Loading Image...</div>
                    )}
                  </div>
                )}

                {upload?.file_type === 'text' && (
                  <div className="w-full h-full flex flex-col bg-[#121212] rounded-xl overflow-hidden border border-white/10 p-5">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">description</span>
                        Extracted Text
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin text-sm text-gray-300 leading-relaxed bg-black/50 p-5 rounded-lg border border-white/5 whitespace-pre-wrap">
                      {upload.extracted_text || 'No text content available.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: AI Learning Assistant (50% Width) */}
          <div className="w-1/2 h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
            {/* Top Navigation Tabs */}
            <div className="h-16 border-b border-white/10 px-8 flex items-center bg-[#000000] justify-between shrink-0">
              <div className="flex gap-6 h-full">
                {[
                  { value: 'notes', label: 'AI Notes', icon: 'edit_note' },
                  { value: 'chat', label: 'AI Tutor', icon: 'forum' },
                  { value: 'flashcards', label: 'Flashcards', icon: 'style' },
                  { value: 'quiz', label: 'Mock Quiz', icon: 'quiz' }
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setActiveTab(t.value as any)}
                    className={`flex items-center gap-2 border-b-2 font-bold text-sm transition-all h-full ${
                      activeTab === t.value
                        ? 'border-white text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Tool View Panel */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6 min-h-0 relative flex flex-col">
              {activeTab === 'chat' && (
                <div className="animate-fade-in h-full flex-grow flex flex-col">
                  <ChatInterface studySetId={id} studySetTitle={studySet.title} />
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="animate-fade-in h-full flex-grow flex flex-col">
                  <NotesViewer
                    notes={notes}
                    isGenerating={generatingNotes}
                    isProcessing={isProcessing}
                    onGenerate={generateNotes}
                  />
                </div>
              )}

              {activeTab === 'flashcards' && (
                <div className="animate-fade-in max-w-[576px] mx-auto w-full flex-grow flex flex-col justify-center">
                  <FlashcardViewer
                    flashcards={flashcards}
                    isGenerating={generatingFlashcards}
                    isProcessing={isProcessing}
                    onGenerate={generateFlashcards}
                    onFlashcardsUpdate={setFlashcards}
                  />
                </div>
              )}

              {activeTab === 'quiz' && (
                <div className="animate-fade-in max-w-[768px] mx-auto w-full flex-grow flex flex-col justify-center">
                  <QuizPlayer studySetId={id} isProcessing={isProcessing} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
