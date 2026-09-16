import { useCallback, useLayoutEffect, useRef, useState } from 'react'

type Options = {
    count: number
    rowHeight: number
    overscan?: number
}

export function useVirtualRange({ count, rowHeight, overscan = 6 }: Options) {
    const ref = useRef<HTMLDivElement>(null)
    const [range, setRange] = useState({ start: 0, end: 0 })
    // Cached, not read per scroll: scrollTop is free in a scroll handler, but
    // clientHeight forces a layout whenever the DOM is dirty — and it is dirty
    // right after every range change. The only thing that alters it is a
    // resize, which the observer below already watches for.
    const viewport = useRef(0)

    const measure = useCallback(() => {
        const element = ref.current
        if (!element) return

        const first = Math.floor(element.scrollTop / rowHeight)
        const visible = Math.ceil(viewport.current / rowHeight)
        const start = Math.max(0, first - overscan)
        const end = Math.min(count, first + visible + overscan)

        // Same range: return previous so React skips the render.
        setRange((previous) =>
            previous.start === start && previous.end === end ? previous : { start, end },
        )
    }, [count, rowHeight, overscan])

    useLayoutEffect(() => {
        const element = ref.current
        if (!element) return

        viewport.current = element.clientHeight
        measure()
        element.addEventListener('scroll', measure, { passive: true })

        // Reads the height where layout has just been computed, so it is never
        // a forced reflow, and hands it to every scroll that follows.
        const observer = new ResizeObserver(() => {
            viewport.current = element.clientHeight
            measure()
        })
        observer.observe(element)

        return () => {
            element.removeEventListener('scroll', measure)
            observer.disconnect()
        }
    }, [measure])

    const scrollToIndex = useCallback(
        (index: number) => {
            const element = ref.current
            if (!element) return

            const top = index * rowHeight
            const bottom = top + rowHeight

            if (top < element.scrollTop) element.scrollTop = top
            else if (bottom > element.scrollTop + viewport.current) {
                element.scrollTop = bottom - viewport.current
            }
        },
        [rowHeight],
    )

    return {
        ref,
        start: range.start,
        end: range.end,
        offsetY: range.start * rowHeight,
        totalHeight: count * rowHeight,
        scrollToIndex,
    }
}
