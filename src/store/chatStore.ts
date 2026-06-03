import { create } from 'zustand'
import type { Message, Chat } from '@/types'

interface ChatState {
  currentChat: Chat | null
  messages: Message[]
  isTyping: boolean
  language: 'english' | 'hindi' | 'hinglish'
  setCurrentChat: (chat: Chat | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setTyping: (typing: boolean) => void
  setLanguage: (language: 'english' | 'hindi' | 'hinglish') => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentChat: null,
  messages: [],
  isTyping: false,
  language: 'english',
  setCurrentChat: (currentChat) => set({ currentChat }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setTyping: (isTyping) => set({ isTyping }),
  setLanguage: (language) => set({ language }),
  clearChat: () => set({ currentChat: null, messages: [] }),
}))
