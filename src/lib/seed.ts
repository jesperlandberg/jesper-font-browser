import type { Family } from '../types'

const REAL = [
    'Helvetica Neue', 'Georgia', 'Menlo', 'Avenir Next', 'Baskerville', 'Courier New',
    'Didot', 'Futura', 'Gill Sans', 'Optima', 'Palatino', 'Times New Roman', 'Verdana',
    'American Typewriter', 'Charter', 'Copperplate', 'Hoefler Text', 'Impact',
]

const STYLES = [
    { style: 'Regular', weight: 400, italic: false },
    { style: 'Italic', weight: 400, italic: true },
    { style: 'Bold', weight: 700, italic: false },
    { style: 'Bold Italic', weight: 700, italic: true },
]

export function seedFamilies(count = 900): Family[] {
    return Array.from({ length: count }, (_, index) => {
        const name = REAL[index] ?? `Sample Face ${String(index).padStart(3, '0')}`
        return {
            id: name,
            name,
            faces: STYLES.slice(0, 1 + (index % STYLES.length)).map((style) => ({
                ...style,
                postscriptName: `${name.replace(/\s/g, '')}-${style.style.replace(/\s/g, '')}`,
                fullName: `${name} ${style.style}`,
            })),
            search: name.toLowerCase(),
        }
    })
}
