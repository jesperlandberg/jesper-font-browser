import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'system' | 'light' | 'dark'

type ThemeState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
    persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), {
        name: 'fonts.theme',
        version: 1,
    }),
)
