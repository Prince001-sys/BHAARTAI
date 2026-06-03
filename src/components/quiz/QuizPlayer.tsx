'use client'

import { useState } from 'react'
import { useQuizStore } from '@/store/quizStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { QuizQuestion } from '@/types'

interface QuizPlayerProps {
  studySetId: string
  isProcessing: boolean
}

function QuizResults({
  score,
  total,
  questions,
  answers,
  onReset,
}: {
  score: number
  total: number
  questions: QuizQuestion[]
  answers: Record<string, string>
  onReset: () => void
}) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto py-8">
      {/* Score Card */}
      <div className="bg-white text-black rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden border border-white/20">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="text-6xl mb-4 relative z-10">{emoji}</div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 relative z-10">Quiz Complete!</h2>
        <p className="text-7xl font-black mt-6 tracking-tighter relative z-10">{percentage}%</p>
        <p className="text-gray-600 font-bold uppercase tracking-widest mt-4 relative z-10">{score} out of {total} correct</p>
      </div>

      {/* Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Review Answers</h3>
        {questions.map((q, index) => {
          const userAnswer = answers[q.id]
          const isCorrect = userAnswer === q.correct_answer
          return (
            <div key={q.id} className={`border rounded-2xl p-6 ${isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <div className="flex items-start gap-4">
                <span className={`material-symbols-outlined text-[24px] shrink-0 mt-0.5 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? 'check_circle' : 'cancel'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white mb-4 leading-relaxed">Q{index + 1}: {q.question}</p>
                  {!isCorrect && (
                    <p className="text-sm text-red-400 font-medium mb-2">
                      Your answer: <span className="font-bold text-white">{userAnswer}</span>
                    </p>
                  )}
                  <p className={`text-sm mb-3 font-medium ${isCorrect ? 'text-green-400' : 'text-green-400'}`}>
                    Correct answer: <span className="font-bold text-white">{q.correct_answer}</span>
                  </p>
                  {q.explanation && (
                    <div className="bg-[#121212] rounded-xl p-4 mt-2 border border-white/5">
                      <p className="text-sm text-gray-400 leading-relaxed"><strong className="text-white">Explanation:</strong> {q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={onReset} className="w-full h-14 bg-[#1A1A1A] border border-white/10 hover:bg-white hover:text-black transition-colors rounded-xl font-bold flex items-center justify-center gap-2 text-white">
        <span className="material-symbols-outlined">restart_alt</span>
        Try Again
      </button>
    </div>
  )
}

export function QuizPlayer({ studySetId, isProcessing }: QuizPlayerProps) {
  const { currentQuiz, questions, answers, currentQuestionIndex, isSubmitted, score, isLoading, setCurrentQuiz, setQuestions, setAnswer, nextQuestion, prevQuestion, submitQuiz, resetQuiz, setLoading } = useQuizStore()
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [savingAttempt, setSavingAttempt] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studySetId, difficulty, count: 10 }),
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)

      const quizRes = await fetch(`/api/quiz/${data.quizId}`)
      const { data: quizData } = await quizRes.json()
      setCurrentQuiz(quizData.quiz)
      setQuestions(quizData.questions)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    submitQuiz()
    
    if (!currentQuiz) return
    setSavingAttempt(true)
    const answersMap: Record<string, string> = {}
    answers.forEach((a) => { answersMap[a.questionId] = a.selectedAnswer })
    
    const calculatedScore = answers.filter((a) => {
      const q = questions.find((q) => q.id === a.questionId)
      return q?.correct_answer === a.selectedAnswer
    }).length

    try {
      await fetch(`/api/quiz/${currentQuiz.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answersMap,
          score: calculatedScore,
          totalQuestions: questions.length,
        }),
      })
    } catch {
      console.error('Failed to save attempt')
    } finally {
      setSavingAttempt(false)
    }
  }

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

  if (!currentQuiz) {
    return (
      <div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-16 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-white/20">
          <span className="material-symbols-outlined text-[36px] text-black">quiz</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Generate Mock Quiz</h3>
        <p className="text-sm text-gray-400 mb-8 max-w-[384px] mx-auto font-medium leading-relaxed">
          Test your understanding with AI-generated multiple choice questions tailored to your study material.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
            <SelectTrigger className="h-14 w-40 rounded-xl border-white/20 bg-[#1A1A1A] text-white font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/20 text-white">
              <SelectItem value="easy" className="font-bold">🟢 Easy</SelectItem>
              <SelectItem value="medium" className="font-bold">🟡 Medium</SelectItem>
              <SelectItem value="hard" className="font-bold">🔴 Hard</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="h-14 px-8 bg-white hover:bg-gray-200 text-black rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <><span className="material-symbols-outlined animate-spin">sync</span> Generating...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">auto_awesome</span> Generate Quiz</>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    const answersMap: Record<string, string> = {}
    answers.forEach((a) => { answersMap[a.questionId] = a.selectedAnswer })

    return (
      <QuizResults
        score={score}
        total={questions.length}
        questions={questions}
        answers={answersMap}
        onReset={resetQuiz}
      />
    )
  }

  const currentQ = questions[currentQuestionIndex]
  if (!currentQ) return null

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const currentAnswer = answers.find((a) => a.questionId === currentQ.id)?.selectedAnswer
  const allAnswered = answers.length === questions.length

  const options = [
    { label: 'A', value: 'A', text: currentQ.option_a },
    { label: 'B', value: 'B', text: currentQ.option_b },
    { label: 'C', value: 'C', text: currentQ.option_c },
    { label: 'D', value: 'D', text: currentQ.option_d },
  ].filter((o) => o.text)

  return (
    <div className="space-y-6 w-full">
      {/* Quiz header */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-white tracking-tight">{currentQuiz.title}</span>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${difficulty === 'easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {difficulty}
          </span>
          <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
      </div>
      
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <p className="text-white font-bold text-xl leading-relaxed mb-8">
          <span className="text-gray-500 mr-2">Q{currentQuestionIndex + 1}.</span> {currentQ.question}
        </p>

        <div className="space-y-4">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAnswer(currentQ.id, opt.value)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
                currentAnswer === opt.value
                  ? 'border-white bg-white/5 text-white shadow-md'
                  : 'border-white/10 hover:border-white/30 hover:bg-white/5 text-gray-300'
              }`}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-colors ${
                currentAnswer === opt.value ? 'bg-white text-black' : 'bg-black border border-white/20 text-white'
              }`}>
                {opt.label}
              </span>
              <span className="text-base font-medium leading-relaxed">{opt.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className="h-14 px-6 bg-[#1A1A1A] border border-white/10 rounded-xl font-bold text-white flex items-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          Previous
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || savingAttempt}
            className="h-14 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 flex-1 max-w-[320px] hover:bg-gray-200 transition-colors disabled:opacity-50 shadow-lg"
          >
            {savingAttempt ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">publish</span>}
            Submit Quiz ({answers.length}/{questions.length})
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="h-14 px-6 bg-[#1A1A1A] border border-white/10 rounded-xl font-bold text-white flex items-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <span className="material-symbols-outlined">chevron_right</span>
          </button>
        )}
      </div>

      <div className="text-center pt-6">
        <button onClick={resetQuiz} className="text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest underline decoration-gray-600 hover:decoration-red-400 underline-offset-4">
          Reset Quiz
        </button>
      </div>
    </div>
  )
}
