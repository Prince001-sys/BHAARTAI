'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Flashcard } from '@/types'

interface FlashcardViewerProps {
  flashcards: Flashcard[]
  isGenerating: boolean
  isProcessing: boolean
  onGenerate?: () => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function FlashcardViewer({
  flashcards,
  isGenerating,
  isProcessing,
  onGenerate,
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [learnedCards, setLearnedCards] = useState<Set<string>>(new Set())

  if (isProcessing) {
    return (
      <div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-16 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
          <span className="material-symbols-outlined text-[32px] text-white animate-spin">sync</span>
        </div>
        <p className="text-gray-400 text-sm font-bold">Content is being processed...</p>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-16 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10">
          <span className="material-symbols-outlined text-[32px] text-white animate-spin">sync</span>
        </div>
        <p className="text-xl font-bold text-white mb-2">Generating flashcards...</p>
        <p className="text-sm text-gray-400 font-medium mt-1">AI is creating cards from your content.</p>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-16 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-white/20">
          <span className="material-symbols-outlined text-[36px] text-black">bolt</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Generate Flashcards</h3>
        <p className="text-sm text-gray-400 mb-8 max-w-[384px] mx-auto font-medium leading-relaxed">
          AI will create interactive flashcards to help you memorize key concepts instantly.
        </p>
        <button
          onClick={onGenerate}
          className="bg-white text-black rounded-xl px-6 py-3 font-bold flex items-center justify-center mx-auto gap-2 hover:bg-gray-200 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Generate Flashcards
        </button>
      </div>
    )
  }

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100
  const learnedCount = learnedCards.size

  const goNext = () => {
    setIsFlipped(false)
    setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, flashcards.length - 1)), 150)
  }

  const goPrev = () => {
    setIsFlipped(false)
    setTimeout(() => setCurrentIndex((i) => Math.max(i - 1, 0)), 150)
  }

  const handleMarkLearned = async () => {
    if (!currentCard) return
    const newSet = new Set(learnedCards)
    const wasLearned = newSet.has(currentCard.id)
    
    if (wasLearned) {
      newSet.delete(currentCard.id)
    } else {
      newSet.add(currentCard.id)
    }
    setLearnedCards(newSet)

    try {
      await fetch(`/api/flashcards/${currentCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_learned: !wasLearned }),
      })
    } catch {
      toast.error('Failed to save progress')
    }

    if (!wasLearned && currentIndex < flashcards.length - 1) {
      setTimeout(goNext, 500)
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setLearnedCards(new Set())
  }

  const isLearned = learnedCards.has(currentCard?.id)

  return (
    <div className="space-y-6 w-full">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-400 font-bold uppercase tracking-widest">
        <span>{currentIndex + 1} of {flashcards.length} cards</span>
        <span className="flex items-center gap-1.5 text-white bg-white/10 px-3 py-1 rounded-md border border-white/10">
          <span className="material-symbols-outlined text-[14px] text-green-400">check_circle</span>
          {learnedCount} learned
        </span>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Flashcard */}
      <div className="relative perspective-1000 w-full" style={{ height: '400px' }}>
        <div
          className={`w-full h-full relative preserve-3d transition-transform duration-500 cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-[#1A1A1A] border border-white/10 rounded-3xl shadow-2xl flex flex-col p-8">
            <div className="flex items-center justify-between w-full mb-6">
              <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${DIFFICULTY_COLORS[currentCard?.difficulty] || DIFFICULTY_COLORS.medium}`}>
                {currentCard?.difficulty}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">touch_app</span>
                Tap to reveal answer
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-2xl font-bold text-white text-center leading-relaxed">
                {currentCard?.question}
              </p>
            </div>
            <div className="w-full mt-6 flex justify-center">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Question</span>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-3xl shadow-2xl flex flex-col p-8 border border-white/20">
            <div className="flex items-center justify-between w-full mb-6">
              <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-black text-white">
                {currentCard?.difficulty}
              </span>
              <span className="text-[10px] font-bold text-black uppercase tracking-widest border-b border-black">Answer</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl font-bold text-black text-center leading-relaxed">
                {currentCard?.answer}
              </p>
            </div>
            <div className="w-full mt-6 flex justify-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">touch_app</span>
                Tap to see question
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="h-14 px-6 bg-[#1A1A1A] border border-white/10 rounded-xl font-bold text-white flex items-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          Prev
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkLearned}
            className={`h-14 px-6 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isLearned
                ? 'bg-green-500 text-black border-transparent'
                : 'bg-[#1A1A1A] border border-white/10 text-white hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {isLearned ? 'Learned' : 'Mark Learned'}
          </button>

          <button
            onClick={handleReset}
            className="h-14 w-14 flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-white/10 text-gray-400 hover:text-white transition-colors"
            title="Reset Progress"
          >
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === flashcards.length - 1}
          className="h-14 px-6 bg-[#1A1A1A] border border-white/10 rounded-xl font-bold text-white flex items-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Regenerate */}
      <div className="text-center pt-6">
        <button
          onClick={onGenerate}
          className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors underline decoration-gray-500 hover:decoration-white underline-offset-4"
        >
          Regenerate flashcards
        </button>
      </div>
    </div>
  )
}
