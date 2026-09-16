import { useCallback, useEffect, useRef } from 'react'
import { Spring, VelocityTracker } from '../lib/spring'

const TRAVEL = { response: 0.42, dampingRatio: 1 }
/** How far ahead of the release the throw is projected, in seconds. */
const PROJECT = 0.12
/** Below this projected position it dismisses instead of returning. */
const DISMISS_BELOW = 0.55
/** How much of an upward overdrag survives past open. */
const RUBBERBAND = 0.25

type Drag = {
    startY: number
    pointerY: number
    /** Progress at the moment it was grabbed. */
    from: number
    height: number
    tracker: VelocityTracker
}

// Writes a number, CSS decides what it means — so a container query can
// switch the recede off at widths where there is no sheet.
export function useSheet(open: boolean, onDismiss: () => void) {
    const root = useRef<HTMLDivElement>(null)
    const sheet = useRef<HTMLDivElement>(null)
    const spring = useRef(new Spring(0, TRAVEL))
    const drag = useRef<Drag | null>(null)
    const frame = useRef(0)

    const write = useCallback((value: number) => {
        root.current?.style.setProperty('--sheet', value.toFixed(4))
    }, [])

    const run = useCallback(() => {
        if (frame.current) return
        root.current?.setAttribute('data-animating', '')
        let last = performance.now()

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 1 / 30)
            last = now

            const held = drag.current
            if (held) {
                const travelled = (held.pointerY - held.startY) / held.height
                const raw = held.from - travelled
                // Past open it keeps a quarter of the overdrag, so pulling up
                // answers without letting the sheet leave the top of the card.
                write(raw > 1 ? 1 + (raw - 1) * RUBBERBAND : Math.max(raw, 0))
                frame.current = requestAnimationFrame(tick)
                return
            }

            const moving = spring.current.step(dt)
            write(spring.current.value)
            if (moving) {
                frame.current = requestAnimationFrame(tick)
                return
            }
            frame.current = 0
            root.current?.removeAttribute('data-animating')
        }
        frame.current = requestAnimationFrame(tick)
    }, [write])

    useEffect(() => {
        if (!root.current) return

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            spring.current.snap(open ? 1 : 0)
            write(spring.current.value)
            return
        }

        spring.current.setTarget(open ? 1 : 0)
        write(spring.current.value)
        if (!spring.current.sleeping) run()
    }, [open, run, write])

    const latest = useRef({ onDismiss, run })
    latest.current = { onDismiss, run }

    // Bound once, guarded by the ref. Binding them when a drag starts cannot
    // work: the drag lives in a ref, so starting one re-renders nothing and the
    // effect that would attach the listeners never runs again.
    useEffect(() => {
        const onMove = (event: PointerEvent) => {
            const held = drag.current
            if (!held) return
            held.pointerY = event.clientY
            held.tracker.add(event.clientY, event.timeStamp / 1000)
        }

        const onUp = () => {
            const held = drag.current
            if (!held) return
            drag.current = null

            const travelled = (held.pointerY - held.startY) / held.height
            const position = Math.min(held.from - travelled, 1)
            const velocity = -held.tracker.velocity() / held.height

            spring.current.snap(position)
            spring.current.addVelocity(velocity)

            // Projected, not travelled: a fast flick dismisses from a few pixels,
            // and a slow drag most of the way down still returns.
            if (position + velocity * PROJECT < DISMISS_BELOW) {
                spring.current.setTarget(0)
                latest.current.onDismiss()
            } else {
                spring.current.setTarget(1)
            }
            latest.current.run()
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)
        }
    }, [])

    const onPointerDown = (event: React.PointerEvent) => {
        const node = sheet.current
        if (!node || event.button !== 0 || drag.current) return

        try {
            event.currentTarget.setPointerCapture(event.pointerId)
        } catch {}

        const tracker = new VelocityTracker()
        tracker.add(event.clientY, event.timeStamp / 1000)

        drag.current = {
            startY: event.clientY,
            pointerY: event.clientY,
            from: spring.current.value,
            height: node.getBoundingClientRect().height,
            tracker,
        }
        run()
    }

    useEffect(() => () => cancelAnimationFrame(frame.current), [])

    return {
        root,
        sheet,
        grabProps: { onPointerDown, style: { touchAction: 'none' as const } },
    }
}
