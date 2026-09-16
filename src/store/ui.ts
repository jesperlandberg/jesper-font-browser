import { create } from 'zustand'
import type { FamilyId } from '../types'

export type Tab = 'all' | 'favorites'

type UIState = {
    tab: Tab
    query: string
    selectedId: FamilyId | null
    specimenText: string
    specimenSize: number
    setTab: (tab: Tab) => void
    setQuery: (query: string) => void
    select: (id: FamilyId | null) => void
    setSpecimenText: (text: string) => void
    setSpecimenSize: (size: number) => void
}

export const useUIStore = create<UIState>((set) => ({
    tab: 'all',
    query: '',
    selectedId: null,
    specimenText: '',
    specimenSize: 48,
    setTab: (tab) => set({ tab }),
    setQuery: (query) => set({ query }),
    select: (selectedId) => set({ selectedId }),
    setSpecimenText: (specimenText) => set({ specimenText }),
    setSpecimenSize: (specimenSize) => set({ specimenSize }),
}))
