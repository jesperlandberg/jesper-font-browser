import { useUIStore } from '../../store/ui'
import { Specimen } from './Specimen'

export function SpecimenSheet({
    open,
    ref,
    grabProps,
}: {
    open: boolean
    ref?: React.Ref<HTMLDivElement>
    grabProps?: React.HTMLAttributes<HTMLDivElement>
}) {
    const select = useUIStore((state) => state.select)

    return (
        <div
            ref={ref}
            inert={!open}
            aria-label="Font styles"
            style={{ '--specimen-scale': 0.7 } as React.CSSProperties}
            className="pointer-events-auto absolute inset-x-0 bottom-0 flex h-[calc(100%-var(--header-h,0px)-var(--sheet-peek))] flex-col rounded-panel border border-line bg-ground shadow-panel [translate:0_calc((1-var(--sheet,0))*100%)] @wide/panel:hidden [[data-animating]_&]:will-change-transform"
        >
            <div
                {...grabProps}
                className="flex cursor-grab touch-none flex-col items-center border-b border-line active:cursor-grabbing"
            >
                <span aria-hidden="true" className="mt-8 h-4 w-40 rounded-control bg-line" />
                <div className="flex w-full items-center justify-between p-8 pl-16">
                    <span className="text-label text-muted uppercase">Styles</span>
                    <button
                        onClick={() => select(null)}
                        aria-label="Close styles"
                    className="scale-100 rounded-control px-8 py-4 text-ui text-muted transition-[color,scale] duration-fast hover:text-ink motion-safe:active:scale-90 active:duration-0"
                >
                        Done
                    </button>
                </div>
            </div>
            <Specimen />
        </div>
    )
}
