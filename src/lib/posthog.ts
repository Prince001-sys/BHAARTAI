let posthog: any = null

if (typeof window !== 'undefined') {
  try {
    posthog = require('posthog-js').default || require('posthog-js')
  } catch (err) {
    console.error('Failed to load posthog-js on client:', err)
  }
}

let initialized = false

export function initPostHog() {
  if (typeof window === 'undefined' || !posthog) return
  if (initialized) return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
    })
    initialized = true
  } catch (err) {
    console.error('Failed to initialize PostHog:', err)
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog) return
  try {
    posthog.identify(userId, properties)
  } catch (err) {
    console.error('PostHog identify error:', err)
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog) return
  try {
    posthog.capture(event, properties)
  } catch (err) {
    console.error('PostHog capture error:', err)
  }
}

export function resetUser() {
  if (typeof window === 'undefined' || !posthog) return
  try {
    posthog.reset()
  } catch (err) {
    console.error('PostHog reset error:', err)
  }
}

// Typed event helpers per analytics spec
export const analytics = {
  signup: (userId: string, method: 'google' | 'phone') => {
    trackEvent('signup', { userId, method })
  },
  upload: (userId: string, fileType: string) => {
    trackEvent('upload', { userId, fileType })
  },
  quizStart: (userId: string, quizId: string, difficulty: string) => {
    trackEvent('quiz_start', { userId, quizId, difficulty })
  },
  quizComplete: (userId: string, quizId: string, score: number, percentage: number) => {
    trackEvent('quiz_complete', { userId, quizId, score, percentage })
  },
  subscriptionPurchased: (userId: string, plan: string, amount: number) => {
    trackEvent('subscription_purchased', { userId, plan, amount })
  },
  notesGenerated: (userId: string, studySetId: string) => {
    trackEvent('notes_generated', { userId, studySetId })
  },
  flashcardsGenerated: (userId: string, studySetId: string, count: number) => {
    trackEvent('flashcards_generated', { userId, studySetId, count })
  },
  chatMessage: (userId: string, chatId: string) => {
    trackEvent('chat_message', { userId, chatId })
  },
}
