import { create } from 'zustand'
import type { StudySet } from '@/types'

interface StudySetState {
  studySets: StudySet[]
  currentStudySet: StudySet | null
  isLoading: boolean
  searchQuery: string
  setStudySets: (sets: StudySet[]) => void
  setCurrentStudySet: (set: StudySet | null) => void
  setLoading: (loading: boolean) => void
  setSearchQuery: (query: string) => void
  addStudySet: (set: StudySet) => void
  updateStudySet: (id: string, updates: Partial<StudySet>) => void
  removeStudySet: (id: string) => void
}

export const useStudySetStore = create<StudySetState>((set) => ({
  studySets: [],
  currentStudySet: null,
  isLoading: false,
  searchQuery: '',
  setStudySets: (studySets) => set({ studySets }),
  setCurrentStudySet: (currentStudySet) => set({ currentStudySet }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  addStudySet: (newSet) =>
    set((state) => ({ studySets: [newSet, ...state.studySets] })),
  updateStudySet: (id, updates) =>
    set((state) => ({
      studySets: state.studySets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      currentStudySet:
        state.currentStudySet?.id === id
          ? { ...state.currentStudySet, ...updates }
          : state.currentStudySet,
    })),
  removeStudySet: (id) =>
    set((state) => ({
      studySets: state.studySets.filter((s) => s.id !== id),
    })),
}))
