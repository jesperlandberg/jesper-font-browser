import { useLayoutEffect, useRef } from 'react'
import { Spring } from '../lib/spring'

const CLOSE = { response: 0.28, dampingRatio: 1 }

export function useCollapse(container: React.RefObject<HTMLElement | null>) {
    const previous = useRef({ ids: [] as string[], tops: new Map<string, number>() })
    const spring = useRef(new Spring(0, CLOSE))
    const moving = useRef(new Map<HTMLElement, number>())
    const frame = useRef(0)

    useLayoutEffect(() => {
        const node = container.current
        if (!node) return

        const rows = [...node.querySelectorAll<HTMLElement>('[data-collapse-id]')]
        const ids = rows.map((row) => row.dataset.collapseId ?? '')
        const tops = new Map(rows.map((row) => [row.dataset.collapseId ?? '', row.offsetTop]))
        const before = previous.current
        previous.current = { ids, tops }

        // Removals only; a reorder is already animated by the drag.
        const removed = before.ids.some((id) => !tops.has(id))
        if (!removed) return

        moving.current.clear()
        for (const row of rows) {
            const was = before.tops.get(row.dataset.collapseId ?? '')
            const now = tops.get(row.dataset.collapseId ?? '')
            if (was === undefined || now === undefined || was === now) continue
            moving.current.set(row, was - now)
        }
        if (moving.current.size === 0) return

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        spring.current.snap(1)
        spring.current.setTarget(0)

        for (const row of moving.current.keys()) row.style.willChange = 'transform'

        if (frame.current) return
        let last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 1 / 30)
            last = now

            const running = spring.current.step(dt)
            for (const [row, distance] of moving.current) {
                const offset = distance * spring.current.value
                row.style.transform = offset ? `translate3d(0, ${offset}px, 0)` : ''
            }

            if (running) {
                frame.current = requestAnimationFrame(tick)
                return
            }
            frame.current = 0
            for (const row of moving.current.keys()) {
                row.style.transform = ''
                row.style.removeProperty('will-change')
            }
            moving.current.clear()
        }
        frame.current = requestAnimationFrame(tick)
    })

    useLayoutEffect(() => () => cancelAnimationFrame(frame.current), [])
}
