import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlanType } from '@/types'

interface SubscriptionState {
  plan: PlanType
  status: string
  uploadsUsedToday: number
  aiQuestionsUsedToday: number
  lastReset: string
  setPlan: (plan: PlanType) => void
  setStatus: (status: string) => void
  incrementUploads: () => void
  incrementAiQuestions: () => void
  resetDailyLimits: () => void
  isPro: () => boolean
  canUpload: () => boolean
  canUseAi: () => boolean
}

const FREE_UPLOAD_LIMIT = 50
const FREE_AI_LIMIT = 100

function getTodayString() {
  return new Date().toDateString()
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      status: 'active',
      uploadsUsedToday: 0,
      aiQuestionsUsedToday: 0,
      lastReset: getTodayString(),

      setPlan: (plan) => set({ plan }),
      setStatus: (status) => set({ status }),

      incrementUploads: () => {
        const today = getTodayString()
        const state = get()
        if (state.lastReset !== today) {
          set({ uploadsUsedToday: 1, aiQuestionsUsedToday: 0, lastReset: today })
        } else {
          set({ uploadsUsedToday: state.uploadsUsedToday + 1 })
        }
      },

      incrementAiQuestions: () => {
        const today = getTodayString()
        const state = get()
        if (state.lastReset !== today) {
          set({ aiQuestionsUsedToday: 1, uploadsUsedToday: 0, lastReset: today })
        } else {
          set({ aiQuestionsUsedToday: state.aiQuestionsUsedToday + 1 })
        }
      },

      resetDailyLimits: () =>
        set({ uploadsUsedToday: 0, aiQuestionsUsedToday: 0, lastReset: getTodayString() }),

      isPro: () => get().plan === 'pro',

      canUpload: () => {
        const state = get()
        if (state.plan === 'pro') return true
        const today = getTodayString()
        if (state.lastReset !== today) return true
        return state.uploadsUsedToday < FREE_UPLOAD_LIMIT
      },

      canUseAi: () => {
        const state = get()
        if (state.plan === 'pro') return true
        const today = getTodayString()
        if (state.lastReset !== today) return true
        return state.aiQuestionsUsedToday < FREE_AI_LIMIT
      },
    }),
    {
      name: 'studyflow-subscription',
    }
  )
)
