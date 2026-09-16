import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Spring } from '../lib/spring'
import { useUIStore, type Tab } from '../store/ui'

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'favorites', label: 'Favourites' },
]

const PILL = { response: 0.25, dampingRatio: 0.9 }

export function Tabs({ onInteract }: { onInteract?: () => void }) {
    const tab = useUIStore((state) => state.tab)
    const setTab = useUIStore((state) => state.setTab)
    const listRef = useRef<HTMLDivElement>(null)
    const pillRef = useRef<HTMLDivElement>(null)
    const x = useRef(new Spring(0, PILL))
    const width = useRef(new Spring(0, PILL))
    const frame = useRef(0)
    const placed = useRef(false)

    const index = TABS.findIndex((entry) => entry.id === tab)

    const activeIndex = useRef(index)
    activeIndex.current = index

    const layout = useCallback((settle: boolean) => {
        const list = listRef.current
        if (!list) return
        const active = list.querySelectorAll<HTMLElement>('[role="tab"]')[activeIndex.current]
        if (!active) return

        const write = () => {
            list.style.setProperty('--pill-x', `${x.current.value.toFixed(2)}px`)
            list.style.setProperty('--pill-w', `${width.current.value.toFixed(2)}px`)
        }

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (settle || reduced || !placed.current) {
            x.current.snap(active.offsetLeft)
            width.current.snap(active.offsetWidth)
            write()
            placed.current = true
            return
        }

        x.current.setTarget(active.offsetLeft)
        width.current.setTarget(active.offsetWidth)

        if (frame.current) return
        let last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 1 / 30)
            last = now
            const moving = [x.current.step(dt), width.current.step(dt)].some(Boolean)
            write()
            frame.current = moving ? requestAnimationFrame(tick) : 0
        }
        frame.current = requestAnimationFrame(tick)
    }, [])

    useLayoutEffect(() => layout(false), [index, layout])

    // Mount only — both fire on registration and would snap the travel.
    useEffect(() => {
        const list = listRef.current
        if (!list) return

        let alive = true
        const observer = new ResizeObserver(() => layout(true))
        observer.observe(list)
        void document.fonts.ready.then(() => alive && layout(true))

        return () => {
            alive = false
            observer.disconnect()
            cancelAnimationFrame(frame.current)
        }
    }, [layout])

    const focusTab = (next: number) => {
        const entry = TABS[next]
        if (!entry) return
        onInteract?.()
        setTab(entry.id)
        listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
    }

    const onKeyDown = (event: React.KeyboardEvent, current: number) => {
        const last = TABS.length - 1
        const target =
            event.key === 'ArrowLeft' ? (current === 0 ? last : current - 1)
            : event.key === 'ArrowRight' ? (current === last ? 0 : current + 1)
            : event.key === 'Home' ? 0
            : event.key === 'End' ? last
            : null

        if (target === null) return
        event.preventDefault()
        focusTab(target)
    }

    return (
        <div ref={listRef} role="tablist" aria-label="Font list" className="relative flex gap-4">
            <div
                ref={pillRef}
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[var(--pill-w,0px)] rounded-control bg-raised [translate:var(--pill-x,0px)_0]"
            />

            {TABS.map(({ id, label }, position) => (
                <button
                    key={id}
                    role="tab"
                    id={`tab-${id}`}
                    aria-controls={`panel-${id}`}
                    aria-selected={id === tab}
                    tabIndex={id === tab ? 0 : -1}
                    onClick={() => {
                        onInteract?.()
                        setTab(id)
                    }}
                    onKeyDown={(event) => onKeyDown(event, position)}
                    className="relative inline-flex h-32 items-center rounded-control px-8 text-ui text-muted transition-colors duration-fast hover:text-ink active:text-ink active:duration-0 aria-selected:text-ink"
                >
                    {label}
                </button>
            ))}
        </div>
    )
}
