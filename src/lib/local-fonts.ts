import type { Face, Family } from '../types'

const WEIGHTS: ReadonlyArray<readonly [token: string, weight: number]> = [
    ['hairline', 100],
    ['extralight', 200],
    ['ultralight', 200],
    ['semibold', 600],
    ['demibold', 600],
    ['extrabold', 800],
    ['ultrabold', 800],
    ['thin', 100],
    ['light', 300],
    ['medium', 500],
    ['bold', 700],
    ['black', 900],
    ['heavy', 900],
]

function parseStyle(style: string): { weight: number; italic: boolean } {
    const key = style.toLowerCase().replace(/[\s\-_]/g, '')
    const hit = WEIGHTS.find(([token]) => key.includes(token))
    return {
        weight: hit ? hit[1] : 400,
        italic: /italic|oblique/.test(key),
    }
}

function byStyle(a: Face, b: Face): number {
    return a.weight - b.weight || Number(a.italic) - Number(b.italic)
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

export function isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function'
}

export async function permissionState(): Promise<PermissionState> {
    try {
        const status = await navigator.permissions.query({ name: 'local-fonts' as PermissionName })
        return status.state
    } catch {
        return 'prompt'
    }
}

export function isPermissionDenied(error: unknown): boolean {
    return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
}

export async function loadFamilies(): Promise<Family[]> {
    const query = window.queryLocalFonts
    if (!query) throw new Error('Local Font Access is unavailable')

    const faces = await query()
    const grouped = new Map<string, Face[]>()

    for (const font of faces) {
        if (font.family.startsWith('.')) continue

        const face: Face = {
            postscriptName: font.postscriptName,
            fullName: font.fullName,
            style: font.style,
            ...parseStyle(font.style),
        }

        const existing = grouped.get(font.family)
        if (existing) existing.push(face)
        else grouped.set(font.family, [face])
    }

    return [...grouped]
        .map(([name, faces]) => ({
            id: name,
            name,
            faces: faces.sort(byStyle),
            search: name.toLowerCase(),
        }))
        .sort((a, b) => collator.compare(a.name, b.name))
}
