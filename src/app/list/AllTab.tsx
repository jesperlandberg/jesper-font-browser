import { useEffect, useState } from 'react'
import { useVirtualRange } from '../../hooks/use-virtual-range'
import type { Family } from '../../types'
import { optionId } from '../../lib/family'
import { useFavoritesStore } from '../../store/favorites'
import { useUIStore } from '../../store/ui'
import { FamilyRow } from './FamilyRow'
import { ROW_HEIGHT } from '../constants'

// Windowed: the focused row can unmount, so focus stays on the list and
// aria-activedescendant names the option. A roving tabindex cannot work here.
export function AllTab({ families }: { families: Family[] }) {
    const selectedId = useUIStore((state) => state.selectedId)
    const select = useUIStore((state) => state.select)
    const toggle = useFavoritesStore((state) => state.toggle)
    const [active, setActive] = useState(0)

    const { ref, start, end, offsetY, totalHeight, scrollToIndex } = useVirtualRange({
        count: families.length,
        rowHeight: ROW_HEIGHT,
    })

    useEffect(() => {
        setActive((current) => Math.min(current, Math.max(families.length - 1, 0)))
    }, [families.length])

    const move = (to: number) => {
        const next = Math.min(Math.max(to, 0), families.length - 1)
        setActive(next)
        scrollToIndex(next)
    }

    const onKeyDown = (event: React.KeyboardEvent) => {
        const family = families[active]

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                return move(active + 1)
            case 'ArrowUp':
                event.preventDefault()
                return move(active - 1)
            case 'Home':
                event.preventDefault()
                return move(0)
            case 'End':
                event.preventDefault()
                return move(families.length - 1)
            case 'PageDown':
                event.preventDefault()
                return move(active + 10)
            case 'PageUp':
                event.preventDefault()
                return move(active - 10)
            case 'Enter':
            case ' ':
                event.preventDefault()
                if (family) select(family.id)
                return
            case 'f':
            case 'F':
                event.preventDefault()
                if (family) toggle(family.id)
        }
    }

    const current = families[active]

    return (
        <>
            <p id="list-keys" className="sr-only">
                Use the arrow keys to browse, Enter to open the styles, and F to favourite.
            </p>

            <div
                ref={ref}
            role="listbox"
            tabIndex={0}
            aria-label="Font families"
            aria-describedby="list-keys"
            aria-activedescendant={current ? optionId(current.id) : undefined}
            onKeyDown={onKeyDown}
            className="group/list @container/list min-w-0 flex-1 @wide/panel:max-w-680 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable] contain-strict focus-visible:outline-none"
        >
            <div role="presentation" className="relative" style={{ height: totalHeight }}>
                <div
                    role="presentation"
                    className="absolute inset-x-0 top-0"
                    style={{ transform: `translateY(${offsetY}px)` }}
                >
                    {families.slice(start, end).map((family, offset) => {
                        const index = start + offset
                        return (
                            <FamilyRow
                                key={family.id}
                                id={optionId(family.id)}
                                role="option"
                                aria-selected={family.id === selectedId}
                                aria-setsize={families.length}
                                aria-posinset={index + 1}
                                data-active={index === active ? '' : undefined}
                                family={family}
                                selected={family.id === selectedId}
                                focusableControls={false}
                                onSelect={(id) => {
                                    setActive(index)
                                    select(id)
                                }}
                            />
                        )
                    })}
                </div>
            </div>
            </div>
        </>
    )
}
