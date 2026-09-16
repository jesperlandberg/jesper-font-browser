import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FamilyId } from '../types'
import { move } from '../lib/array'
import { memoOne } from '../lib/memo'

type FavoritesState = {
    order: FamilyId[]
    toggle: (id: FamilyId) => void
    remove: (id: FamilyId) => void
    reorder: (from: number, to: number) => void
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set) => ({
            order: [],

            toggle: (id) =>
                set((state) => ({
                    order: state.order.includes(id)
                        ? state.order.filter((current) => current !== id)
                        : // Newest first: a favourite you just made should not land
                          [id, ...state.order],
                })),

            remove: (id) => set((state) => ({ order: state.order.filter((current) => current !== id) })),

            reorder: (from, to) => set((state) => ({ order: move(state.order, from, to) })),
        }),
        { name: 'fonts.favorites', version: 1 },
    ),
)

const setOf = memoOne((order: readonly FamilyId[]) => new Set(order))

export function useIsFavorite(id: FamilyId): boolean {
    return useFavoritesStore((state) => setOf(state.order).has(id))
}
