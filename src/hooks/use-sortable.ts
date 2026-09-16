import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Spring, VelocityTracker } from '../lib/spring'

type Options = {
    count: number
    onReorder: (from: number, to: number) => void
    label?: (index: number) => string
}

type Mode = 'idle' | 'pointer' | 'keyboard'

const DISPLACE = { response: 0.28, dampingRatio: 1 }
const GRAB = { response: 0.25, dampingRatio: 0.9 }
const SETTLE = { response: 0.32, dampingRatio: 1 }

const LIFT = 0.008
const NUDGE = 5
const RANGE = 0.45
const MAX_RELEASE = 1600

const EDGE = 64
const SCROLL_SPEED = 14

type Drag = {
    origin: number
    current: number
    rowHeight: number
    bounds: DOMRect
    pointerY: number
    startY: number
    startScroll: number
    distance: number
    tracker: VelocityTracker
}

type Motion = {
    items: HTMLElement[]
    origin: number
    rows: Spring[]
    grab: Spring
    flight: Spring
    frame: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function useSortable({ count, onReorder, label }: Options) {
    const containerRef = useRef<HTMLDivElement>(null)
    const motion = useRef<Motion | null>(null)
    const drag = useRef<Drag | null>(null)
    const lastTime = useRef(0)
    const liftOrigin = useRef(0)
    const liftLabel = useRef('')

    const [mode, setMode] = useState<Mode>('idle')
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [announcement, setAnnouncement] = useState('')

    const latest = useRef({ count, onReorder, label })
    latest.current = { count, onReorder, label }

    const aim = useCallback((spring: Spring, target: number) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) spring.snap(target)
        else spring.setTarget(target)
    }, [])

    const lift = useCallback((index: number) => {
        const { count, label } = latest.current
        liftLabel.current = label?.(index) ?? `Item ${index + 1}`
        setAnnouncement(`${liftLabel.current} lifted, position ${index + 1} of ${count}`)
    }, [])

    const describe = useCallback((index: number, action: string) => {
        setAnnouncement(`${liftLabel.current} ${action}, position ${index + 1} of ${latest.current.count}`)
    }, [])

    const frame = useCallback(
        (now: number) => {
            const state = motion.current
            const container = containerRef.current
            if (!state || !container) return

            const dt = Math.min((now - lastTime.current) / 1000, 1 / 30)
            lastTime.current = now

            const held = drag.current
            if (held) {
                const fromTop = held.pointerY - held.bounds.top
                const fromBottom = held.bounds.bottom - held.pointerY
                if (fromTop < EDGE) container.scrollTop -= (1 - fromTop / EDGE) * SCROLL_SPEED
                else if (fromBottom < EDGE) container.scrollTop += (1 - fromBottom / EDGE) * SCROLL_SPEED

                const travel = held.pointerY - held.startY + (container.scrollTop - held.startScroll)
                held.distance = clamp(
                    travel,
                    -held.origin * held.rowHeight,
                    (state.items.length - 1 - held.origin) * held.rowHeight,
                )
                held.tracker.add(held.distance, now / 1000)

                const rows = held.distance / held.rowHeight
                held.current = clamp(held.origin + Math.round(rows), 0, state.items.length - 1)

                for (let index = 0; index < state.items.length; index++) {
                    if (index === state.origin) continue
                    const spring = state.rows[index]
                    if (!spring) continue

                    const below = index > state.origin
                    const direction = below ? -1 : 1
                    const threshold = index - state.origin + (below ? -0.5 : 0.5)
                    const displaced = below ? rows >= threshold : rows <= threshold

                    if (displaced) {
                        aim(spring, direction * held.rowHeight)
                    } else {
                        const slack = below ? threshold - rows : rows - threshold
                        aim(spring, direction * NUDGE * clamp(1 - slack / RANGE, 0, 1))
                    }
                }
            }

            let moving = false
            for (let index = 0; index < state.items.length; index++) {
                if (index === state.origin) continue
                const spring = state.rows[index]
                const element = state.items[index]
                if (!spring || !element) continue

                const awake = !spring.sleeping
                if (spring.step(dt)) moving = true
                if (awake) {
                    element.style.transform = spring.value === 0 ? '' : `translate3d(0, ${spring.value}px, 0)`
                }
            }

            state.grab.step(dt)
            state.flight.step(dt)

            const active = state.items[state.origin]
            if (active) {
                const offset = held ? held.distance : state.flight.value
                active.style.transform = `translate3d(0, ${offset}px, 0) scale(${1 + state.grab.value * LIFT})`
            }

            if (held || moving || !state.grab.sleeping || !state.flight.sleeping) {
                state.frame = requestAnimationFrame(frame)
                return
            }

            for (const element of state.items) element.style.willChange = ''
            if (active) {
                active.style.transform = ''
                active.style.zIndex = ''
                active.style.position = ''
            }
            motion.current = null
        },
        [aim],
    )

    const finish = useCallback(
        (commit: boolean) => {
            const held = drag.current
            const state = motion.current
            if (!held || !state) return
            drag.current = null

            const landing = commit ? held.current : held.origin

            for (const spring of state.rows) spring.snap(0)
            for (let index = 0; index < state.items.length; index++) {
                if (index !== state.origin) {
                    const element = state.items[index]
                    if (element) element.style.transform = ''
                }
            }

            state.flight.snap(held.distance - (landing - held.origin) * held.rowHeight)
            aim(state.flight, 0)
            state.flight.addVelocity(clamp(held.tracker.velocity(), -MAX_RELEASE, MAX_RELEASE))
            aim(state.grab, 0)

            setMode('idle')
            setActiveIndex(null)

            if (commit && landing !== held.origin) {
                latest.current.onReorder(held.origin, landing)
                describe(landing, 'dropped')
            }
        },
        [aim, describe],
    )

    useEffect(() => {
        if (mode !== 'pointer') return

        // Pointer only records; the frame loop does every read and write.
        const onMove = (event: PointerEvent) => {
            if (drag.current) drag.current.pointerY = event.clientY
        }
        const onUp = () => finish(true)
        const onCancel = () => finish(false)

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onCancel)

        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onCancel)
        }
    }, [mode, finish])

    const onPointerDown = useCallback(
        (index: number, event: React.PointerEvent) => {
            if (event.button !== 0 || drag.current) return
            const container = containerRef.current
            if (!container) return

            const items = [...container.querySelectorAll<HTMLElement>('[data-sortable-item]')]
            const [first, second] = items
            if (!first || !second) return

            // Measure the step — the gap between rows is part of it.
            const rowHeight = second.offsetTop - first.offsetTop
            if (rowHeight <= 0) return

            try {
                event.currentTarget.setPointerCapture(event.pointerId)
            } catch {}

            if (motion.current) cancelAnimationFrame(motion.current.frame)

            const held = items[index]
            if (held) {
                held.style.position = 'relative'
                held.style.zIndex = '1'
            }

            for (const element of items) element.style.willChange = 'transform'

            const tracker = new VelocityTracker()
            tracker.add(0, event.timeStamp / 1000)

            motion.current = {
                items,
                origin: index,
                rows: items.map(() => new Spring(0, DISPLACE)),
                grab: new Spring(0, GRAB),
                flight: new Spring(0, SETTLE),
                frame: 0,
            }
            aim(motion.current.grab, 1)

            drag.current = {
                origin: index,
                current: index,
                rowHeight,
                bounds: container.getBoundingClientRect(),
                pointerY: event.clientY,
                startY: event.clientY,
                startScroll: container.scrollTop,
                distance: 0,
                tracker,
            }

            lastTime.current = performance.now()
            motion.current.frame = requestAnimationFrame(frame)

            setMode('pointer')
            setActiveIndex(index)
            lift(index)
        },
        [frame, lift, aim],
    )

    const onKeyDown = useCallback(
        (index: number, event: React.KeyboardEvent) => {
            if (drag.current) return
            const { count, onReorder } = latest.current

            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault()
                if (mode === 'keyboard') {
                    setMode('idle')
                    setActiveIndex(null)
                    describe(index, 'dropped')
                } else {
                    liftOrigin.current = index
                    setMode('keyboard')
                    setActiveIndex(index)
                    lift(index)
                }
                return
            }

            if (mode !== 'keyboard') return

            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault()
                const to = clamp(index + (event.key === 'ArrowDown' ? 1 : -1), 0, count - 1)
                if (to === index) return

                onReorder(index, to)
                setActiveIndex(to)
                describe(to, 'moved')
                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                onReorder(index, liftOrigin.current)
                setMode('idle')
                setActiveIndex(null)
                describe(liftOrigin.current, 'returned')
            }
        },
        [mode, describe, lift],
    )

    useLayoutEffect(() => {
        if (mode !== 'keyboard' || activeIndex === null) return
        const handles = containerRef.current?.querySelectorAll<HTMLElement>('[data-sortable-handle]')
        handles?.[activeIndex]?.focus()
    }, [mode, activeIndex])

    useEffect(() => () => {
        if (motion.current) cancelAnimationFrame(motion.current.frame)
    }, [])

    return {
        mode,
        activeIndex,
        announcement,
        containerProps: { ref: containerRef },
        itemProps: (index: number) => ({
            'data-sortable-item': '',
            'data-dragging': index === activeIndex ? '' : undefined,
        }),
        handleProps: (index: number) => ({
            'data-sortable-handle': '',
            onPointerDown: (event: React.PointerEvent) => onPointerDown(index, event),
            onKeyDown: (event: React.KeyboardEvent) => onKeyDown(index, event),
            style: { touchAction: 'none' as const },
            'aria-roledescription': 'sortable',
            'aria-pressed': mode === 'keyboard' && activeIndex === index,
        }),
    }
}
