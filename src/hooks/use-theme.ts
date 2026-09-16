import { useEffect, useSyncExternalStore } from 'react'
import { useThemeStore } from '../store/theme'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

export function useTheme() {
    const theme = useThemeStore((state) => state.theme)
    const setTheme = useThemeStore((state) => state.setTheme)

    const systemIsDark = useSyncExternalStore(
        (notify) => {
            const media = query()
            media.addEventListener('change', notify)
            return () => media.removeEventListener('change', notify)
        },
        () => query().matches,
        () => false,
    )

    const resolved = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme

    useEffect(() => {
        const root = document.documentElement

        root.setAttribute('data-theme-switching', '')

        if (theme === 'system') root.removeAttribute('data-theme')
        else root.setAttribute('data-theme', theme)

        // Two frames: the paint has to land before transitions come back.
        const frame = requestAnimationFrame(() =>
            requestAnimationFrame(() => root.removeAttribute('data-theme-switching')),
        )
        return () => cancelAnimationFrame(frame)
    }, [theme])

    return { resolved, toggle: () => setTheme(resolved === 'dark' ? 'light' : 'dark') }
}
