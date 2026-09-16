import { useMemo } from 'react'
import type { Family } from '../types'
import { ghostFamily } from '../lib/family'
import { useFavoritesStore } from '../store/favorites'
import { useFontsStore } from '../store/fonts'
import { useUIStore } from '../store/ui'

export function useVisibleFamilies(): Family[] {
    const families = useFontsStore((state) => state.families)
    const byId = useFontsStore((state) => state.byId)
    const order = useFavoritesStore((state) => state.order)
    const tab = useUIStore((state) => state.tab)
    const query = useUIStore((state) => state.query)

    return useMemo(() => {
        const source =
            tab === 'all' ? families : order.map((id) => byId.get(id) ?? ghostFamily(id))

        const needle = query.trim().toLowerCase()
        if (!needle) return source

        const matches = source.filter((family) => family.search.includes(needle))

        if (tab !== 'all') return matches

        const leading: Family[] = []
        const rest: Family[] = []
        for (const family of matches) {
            ;(family.search.startsWith(needle) ? leading : rest).push(family)
        }
        return [...leading, ...rest]
    }, [tab, families, byId, order, query])
}
