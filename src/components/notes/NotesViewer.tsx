'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { AiNotes } from '@/types'

interface NotesViewerProps {
  notes: AiNotes | null
  isGenerating: boolean
  isProcessing: boolean
  onGenerate: () => void
}

function NotesSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse" />
      <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
      <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
      <div className="h-4 w-4/5 bg-white/5 rounded animate-pulse" />
      <div className="h-6 w-48 mt-8 bg-white/5 rounded-lg animate-pulse" />
      <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-notes p-8 overflow-y-auto h-[calc(100vh-16rem)] scrollbar-thin text-gray-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

export function NotesViewer({ notes, isGenerating, isProcessing, onGenerate }: NotesViewerProps) {
  const [notesTab, setNotesTab] = useState('summary')

  if (isProcessing) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-16 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
          <span className="material-symbols-outlined text-[32px] text-white animate-spin">sync</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Processing your content...</h3>
        <p className="text-sm text-gray-400">This usually takes 30–60 seconds. Notes will be generated automatically.</p>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="h-full flex flex-col bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 p-5 border-b border-white/10 bg-[#1A1A1A]">
          <span className="material-symbols-outlined text-[20px] text-white animate-spin">sync</span>
          <span className="text-sm font-bold text-white uppercase tracking-wider">AI is generating your notes...</span>
        </div>
        <div className="flex-1">
          <NotesSkeleton />
        </div>
      </div>
    )
  }

  if (!notes) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#121212] border border-white/10 rounded-2xl p-16 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-white/20">
          <span className="material-symbols-outlined text-[36px] text-black">auto_awesome</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Generate AI Notes</h3>
        <p className="text-sm text-gray-400 mb-8 max-w-[384px] mx-auto font-medium leading-relaxed">
          AI will create smart notes from your content including summary, detailed notes, and revision notes.
        </p>
        <button
          onClick={onGenerate}
          className="bg-white text-black rounded-xl px-6 py-3 font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Generate Notes
        </button>
      </div>
    )
  }

  const noteTabs = [
    { value: 'summary', label: 'Summary', icon: 'menu_book', content: notes.summary },
    { value: 'detailed', label: 'Detailed', icon: 'description', content: notes.detailed_notes },
    { value: 'revision', label: 'Revision', icon: 'bolt', content: notes.revision_notes },
    { value: 'exam', label: 'Exam Notes', icon: 'auto_awesome', content: notes.exam_notes },
  ].filter((t) => t.content)

  return (
    <div className="h-full flex flex-col bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <Tabs value={notesTab} onValueChange={setNotesTab} className="h-full flex flex-col">
        <div className="border-b border-white/10 px-4 pt-3 pb-3 shrink-0 bg-[#0A0A0A]">
          <TabsList className="bg-transparent p-0 gap-2 w-full justify-start overflow-x-auto flex-nowrap scrollbar-none">
            {noteTabs.map(({ value, label, icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 text-sm px-4 py-2 font-bold transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {noteTabs.map(({ value, content }) => (
          <TabsContent key={value} value={value} className="mt-0 flex-1 overflow-hidden bg-[#121212] focus-visible:outline-none">
            {content ? <MarkdownContent content={content} /> : (
              <div className="p-12 text-center text-gray-500 text-sm font-bold">No content available.</div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
