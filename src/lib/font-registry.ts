import { quoteFamily } from './css'

const MAX_COLD = 256

const entries = new Map<string, { face: FontFace; refs: number }>()
const cold = new Map<string, true>()

// Derived, not assigned: a row names its face during render, not after.
export function cssFamily(postscriptName: string): string {
    return quoteFamily(`lf ${postscriptName}`)
}

export function acquire(postscriptName: string): void {
    let entry = entries.get(postscriptName)

    if (!entry) {
        const face = new FontFace(`lf ${postscriptName}`, `local("${postscriptName}")`)
        face.load().catch(() => {})
        document.fonts.add(face)
        entry = { face, refs: 0 }
        entries.set(postscriptName, entry)
    }

    entry.refs++
    cold.delete(postscriptName)
}

// Released, not destroyed — scrolling back over ground is free.
export function release(postscriptName: string): void {
    const entry = entries.get(postscriptName)
    if (!entry || entry.refs === 0) return

    entry.refs--
    if (entry.refs > 0) return

    cold.delete(postscriptName)
    cold.set(postscriptName, true)

    while (cold.size > MAX_COLD) {
        const oldest = cold.keys().next()
        if (oldest.done) break

        const stale = entries.get(oldest.value)
        if (stale) document.fonts.delete(stale.face)
        entries.delete(oldest.value)
        cold.delete(oldest.value)
    }
}

export function stats(): { registered: number; hot: number; cold: number } {
    return { registered: entries.size, hot: entries.size - cold.size, cold: cold.size }
}
