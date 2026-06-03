import { create } from 'zustand'
import type { Quiz, QuizQuestion } from '@/types'

interface QuizAnswer {
  questionId: string
  selectedAnswer: string
}

interface QuizState {
  currentQuiz: Quiz | null
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  currentQuestionIndex: number
  isSubmitted: boolean
  score: number
  isLoading: boolean
  setCurrentQuiz: (quiz: Quiz | null) => void
  setQuestions: (questions: QuizQuestion[]) => void
  setAnswer: (questionId: string, answer: string) => void
  nextQuestion: () => void
  prevQuestion: () => void
  submitQuiz: () => void
  resetQuiz: () => void
  setLoading: (loading: boolean) => void
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentQuiz: null,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  isSubmitted: false,
  score: 0,
  isLoading: false,
  setCurrentQuiz: (currentQuiz) => set({ currentQuiz }),
  setQuestions: (questions) => set({ questions, answers: [], currentQuestionIndex: 0, isSubmitted: false, score: 0 }),
  setAnswer: (questionId, selectedAnswer) =>
    set((state) => {
      const existing = state.answers.findIndex((a) => a.questionId === questionId)
      if (existing >= 0) {
        const newAnswers = [...state.answers]
        newAnswers[existing] = { questionId, selectedAnswer }
        return { answers: newAnswers }
      }
      return { answers: [...state.answers, { questionId, selectedAnswer }] }
    }),
  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1),
    })),
  prevQuestion: () =>
    set((state) => ({
      currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
    })),
  submitQuiz: () => {
    const { questions, answers } = get()
    let score = 0
    answers.forEach((answer) => {
      const question = questions.find((q) => q.id === answer.questionId)
      if (question && answer.selectedAnswer === question.correct_answer) {
        score++
      }
    })
    set({ isSubmitted: true, score })
  },
  resetQuiz: () =>
    set({
      currentQuiz: null,
      questions: [],
      answers: [],
      currentQuestionIndex: 0,
      isSubmitted: false,
      score: 0,
    }),
  setLoading: (isLoading) => set({ isLoading }),
}))
