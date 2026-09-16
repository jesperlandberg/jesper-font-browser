import { useEffect } from 'react'
import { acquire, cssFamily, release } from '../lib/font-registry'

export function useFontFace(postscriptName: string): string {
    useEffect(() => {
        acquire(postscriptName)
        return () => release(postscriptName)
    }, [postscriptName])

    return cssFamily(postscriptName)
}

export function useFontFaces(postscriptNames: readonly string[]): void {
    const key = postscriptNames.join('\n')

    useEffect(() => {
        if (!key) return
        const names = key.split('\n')
        names.forEach(acquire)
        return () => names.forEach(release)
    }, [key])
}
