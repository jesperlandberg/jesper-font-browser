import { create } from 'zustand'
import type { Family, FamilyId } from '../types'
import { isPermissionDenied, isSupported, loadFamilies, permissionState } from '../lib/local-fonts'

export type FontsStatus =
    | 'checking'
    | 'unsupported'
    | 'idle'
    | 'loading'
    | 'ready'
    | 'denied'
    | 'error'

type FontsState = {
    status: FontsStatus
    families: Family[]
    byId: ReadonlyMap<FamilyId, Family>
    error: string | null
    demo: boolean
    init: () => Promise<void>
    load: () => Promise<void>
    demoFonts: () => Promise<void>
}

const empty: ReadonlyMap<FamilyId, Family> = new Map()

export const useFontsStore = create<FontsState>((set, get) => ({
    status: 'checking',
    families: [],
    byId: empty,
    error: null,
    demo: false,

    async demoFonts() {
        const { seedFamilies } = await import('../lib/seed')
        const families = seedFamilies()
        set({
            status: 'ready',
            demo: true,
            families,
            byId: new Map(families.map((family) => [family.id, family])),
        })
    },

    async init() {
        if (new URLSearchParams(location.search).has('seed')) return get().demoFonts()

        if (!isSupported()) return set({ status: 'unsupported' })

        const permission = await permissionState()
        if (permission === 'granted') return get().load()
        set({ status: permission === 'denied' ? 'denied' : 'idle' })
    },

    async load() {
        if (get().status === 'loading') return
        set({ status: 'loading', error: null })

        try {
            const families = await loadFamilies()
            set({
                status: 'ready',
                families,
                byId: new Map(families.map((family) => [family.id, family])),
            })
        } catch (error) {
            if (isPermissionDenied(error)) return set({ status: 'denied' })
            set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
        }
    },
}))
