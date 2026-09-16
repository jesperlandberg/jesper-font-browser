import { memo } from 'react'
import type { Family, FamilyId } from '../../types'
import { quoteFamily } from '../../lib/css'
import { isInstalled } from '../../lib/family'
import { useFavoritesStore, useIsFavorite } from '../../store/favorites'
import { Star } from '../icons'
import { ROW_HEIGHT } from '../constants'

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> & {
    family: Family
    selected: boolean
    onSelect: (id: FamilyId) => void
    handle?: React.ReactNode
    focusableControls?: boolean
}

function Row({ family, selected, onSelect, handle, focusableControls = true, ...rest }: Props) {
    const installed = isInstalled(family)
    const toggle = useFavoritesStore((state) => state.toggle)
    const favorite = useIsFavorite(family.id)

    return (
        <div
            {...rest}
            data-selected={selected ? '' : undefined}
            style={{ height: ROW_HEIGHT }}
            onClick={() => onSelect(family.id)}
            className="relative flex cursor-default items-center gap-12 overflow-hidden border-b border-line px-16 transition-[background-color] duration-fast not-group-data-[dragging]/item:not-data-[selected]:hover:bg-raised/55 not-group-data-[dragging]/item:data-[selected]:bg-raised group-data-[dragging]/item:bg-ground/85 group-focus-visible/list:data-[active]:inset-ring-2 group-focus-visible/list:data-[active]:inset-ring-accent"
        >
            {handle}

            <span className="hidden w-160 shrink-0 truncate py-[0.35em] text-trim text-ui text-muted @tight/list:block">
                {family.name}
                {!installed && ' · missing'}
            </span>

            {installed && (
                <span className="flex h-full min-w-0 flex-1 items-center overflow-hidden [mask-image:linear-gradient(to_right,#000_calc(100%_-_4rem),transparent)]">
                    <span
                        aria-hidden="true"
                        style={{ fontFamily: quoteFamily(family.name) }}
                        className="text-trim whitespace-nowrap text-specimen"
                    >
                        {family.name}
                    </span>
                </span>
            )}

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation()
                    toggle(family.id)
                }}
                {...(focusableControls
                    ? {
                          'aria-pressed': favorite,
                          'aria-label': `${favorite ? 'Remove' : 'Add'} ${family.name} ${favorite ? 'from' : 'to'} favourites`,
                      }
                    : { tabIndex: -1, 'aria-hidden': true })}
                className="group relative z-1 -mr-8 shrink-0 p-8 text-muted transition-colors duration-fast hover:text-ink data-[on]:text-accent"
                data-on={favorite ? '' : undefined}
            >
                <span className="block scale-100 transition-[scale] duration-fast motion-safe:group-active:scale-90 group-active:duration-0">
                    <Star filled={favorite} />
                </span>
            </button>
        </div>
    )
}

export const FamilyRow = memo(Row)
