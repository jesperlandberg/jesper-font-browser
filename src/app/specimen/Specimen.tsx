import { useDeferredValue, useEffect, useRef } from 'react'
import { useFontFaces } from '../../hooks/use-font-face'
import { cssFamily } from '../../lib/font-registry'
import { useFontsStore } from '../../store/fonts'
import { useUIStore } from '../../store/ui'

const SIZE = { min: 12, max: 160 }
const asRange = (size: number) => (size - SIZE.min) / (SIZE.max - SIZE.min)

export function Specimen() {
    const panel = useRef<HTMLDivElement>(null)
    const pendingSize = useRef(0)
    const frame = useRef(0)
    const selectedId = useUIStore((state) => state.selectedId)
    const text = useUIStore((state) => state.specimenText)
    const size = useUIStore((state) => state.specimenSize)
    const setText = useUIStore((state) => state.setSpecimenText)
    const setSize = useUIStore((state) => state.setSpecimenSize)
    const family = useFontsStore((state) => (selectedId ? state.byId.get(selectedId) : undefined))

    const faces = family?.faces ?? []
    useFontFaces(faces.map((face) => face.postscriptName))

    const deferredText = useDeferredValue(text)

    useEffect(() => () => cancelAnimationFrame(frame.current), [])

    if (!family) return <p className="p-16 text-muted">Select a family.</p>

    return (
        <div
            ref={panel}
            style={{ '--specimen-size': `${size}px`, '--range': asRange(size) } as React.CSSProperties}
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
        >
            <header className="sticky top-0 flex flex-col gap-16 border-b border-line bg-ground p-16">
                <div className="flex flex-col gap-4">
                    <h2 className="text-title">{family.name}</h2>
                    <p className="text-label text-muted uppercase">
                        {faces.length} {faces.length === 1 ? 'style' : 'styles'}
                    </p>
                </div>
                <input
                    value={text}
                    placeholder={family.name}
                    onChange={(event) => setText(event.target.value)}
                    aria-label="Specimen text"
                    className="h-32 rounded-control bg-raised px-8 text-ui"
                />
                <input
                    type="range"
                    min={SIZE.min}
                    max={SIZE.max}
                    defaultValue={size}
                    onInput={(event) => {
                        pendingSize.current = Number(event.currentTarget.value)
                        if (frame.current) return
                        frame.current = requestAnimationFrame(() => {
                            frame.current = 0
                            const node = panel.current
                            if (!node) return
                            node.style.setProperty('--specimen-size', `${pendingSize.current}px`)
                            node.style.setProperty('--range', String(asRange(pendingSize.current)))
                        })
                    }}
                    onPointerUp={(event) => setSize(Number(event.currentTarget.value))}
                    onKeyUp={(event) => setSize(Number(event.currentTarget.value))}
                    aria-label="Specimen size"
                    className="range"
                />
            </header>

            {faces.map((face) => (
                <section key={face.postscriptName} className="border-b border-line p-16">
                    <span className="text-label text-muted uppercase">{face.style}</span>
                    <p
                        style={{
                            fontFamily: cssFamily(face.postscriptName),
                            fontSize: 'calc(var(--specimen-size) * var(--specimen-scale, 1))',
                        }}
                        className="mt-8 leading-[1.15] break-words"
                    >
                        {deferredText || family.name}
                    </p>
                </section>
            ))}
        </div>
    )
}
