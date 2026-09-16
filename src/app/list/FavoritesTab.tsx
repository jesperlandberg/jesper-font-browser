import { useCollapse } from '../../hooks/use-collapse'
import { useSortable } from '../../hooks/use-sortable'
import type { Family } from '../../types'
import { useFavoritesStore } from '../../store/favorites'
import { useUIStore } from '../../store/ui'
import { FamilyRow } from './FamilyRow'
import { DragHandle } from '../icons'

export function FavoritesTab({ families }: { families: Family[] }) {
    const reorder = useFavoritesStore((state) => state.reorder)
    const selectedId = useUIStore((state) => state.selectedId)
    const select = useUIStore((state) => state.select)

    const sortable = useSortable({
        count: families.length,
        onReorder: reorder,
        label: (index) => families[index]?.name ?? 'Font',
    })

    useCollapse(sortable.containerProps.ref)

    if (families.length === 0) {
        return <p className="p-16 text-muted">No favourites yet.</p>
    }

    return (
        <>
            <div {...sortable.containerProps} className="@container/list min-w-0 flex-1 @wide/panel:max-w-680 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                <ul aria-label="Favourite font families" className="list-none">
                    {families.map((family, index) => (
                        <li
                            key={family.id}
                            data-collapse-id={family.id}
                            className="group/item transition-shadow data-[dragging]:relative data-[dragging]:z-1 data-[dragging]:shadow-lift"
                            {...sortable.itemProps(index)}
                        >
                            <FamilyRow
                                family={family}
                                selected={family.id === selectedId}
                                onSelect={select}
                                handle={
                                    <button
                                        aria-label={`Reorder ${family.name}`}
                                        className="relative z-1 -ml-8 shrink-0 cursor-grab p-8 text-muted transition-colors duration-fast hover:text-ink active:cursor-grabbing"
                                        {...sortable.handleProps(index)}
                                    >
                                        <DragHandle />
                                    </button>
                                }
                            />
                        </li>
                    ))}
                </ul>
            </div>

            <div className="sr-only" role="status">
                {sortable.announcement}
            </div>
        </>
    )
}
