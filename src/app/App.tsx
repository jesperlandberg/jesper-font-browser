import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSheet } from '../hooks/use-sheet'
import { useTheme } from '../hooks/use-theme'
import { useVisibleFamilies } from '../hooks/use-visible-families'
import { useFontsStore } from '../store/fonts'
import { useUIStore } from '../store/ui'
import { AllTab } from './list/AllTab'
import { FavoritesTab } from './list/FavoritesTab'
import { Gate } from './Gate'
import { Shell } from './Shell'
import { SpecimenPane } from './specimen/SpecimenPane'
import { SpecimenSheet } from './specimen/SpecimenSheet'
import { Stats } from '../dev/Stats'
import { Tabs } from './Tabs'
import { Moon, Sun } from './icons'

export function App() {
    const status = useFontsStore((state) => state.status)
    const demo = useFontsStore((state) => state.demo)
    const init = useFontsStore((state) => state.init)
    const tab = useUIStore((state) => state.tab)
    const query = useUIStore((state) => state.query)
    const selectedId = useUIStore((state) => state.selectedId)
    const setQuery = useUIStore((state) => state.setQuery)
    const select = useUIStore((state) => state.select)
    const families = useVisibleFamilies()
    const search = useRef<HTMLInputElement>(null)
    const { resolved, toggle } = useTheme()
    const header = useRef<HTMLElement>(null)

    // The sheet must never cover the header, and the header is two rows on a
    // phone and one on a laptop — so its height is published rather than
    // assumed, and the sheet caps itself against it.
    useLayoutEffect(() => {
        const node = header.current
        const root = sheet.root.current
        if (!node || !root) return
        // Border box, not contentRect: the header carries padding and a border,
        // and the sheet has to clear what it occupies, not what it contains.
        const observer = new ResizeObserver(([entry]) => {
            const height = entry?.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight
            root.style.setProperty('--header-h', `${height}px`)
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [status])

    /** Changing the list while holding a detail from it is incoherent, so the
     *  header is also the way out — but only where the sheet is the presentation. */
    const dismissSheet = () => {
        const node = sheet.sheet.current
        if (node && getComputedStyle(node).display !== 'none') select(null)
    }

    const sheet = useSheet(selectedId !== null, () => select(null))

    useEffect(() => {
        void init()
    }, [init])

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea')

            if (event.key === '/' && !typing) {
                event.preventDefault()
                search.current?.focus()
                return
            }
            if (event.key === 'Escape' && !typing) select(null)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [select])

    if (status === 'checking') return null

    return (
        <>
            <Shell ref={sheet.root} sheet={
                    status === 'ready' ? (
                        <SpecimenSheet
                            open={selectedId !== null}
                            ref={sheet.sheet}
                            grabProps={sheet.grabProps}
                        />
                    ) : null
                }>
                {status !== 'ready' ? (
                    <Gate />
                ) : (
                    <>
                        <header ref={header} className="flex flex-wrap items-center gap-8 border-b border-line p-8 @min-[46rem]/panel:gap-16">
                            <Tabs onInteract={dismissSheet} />

                            <input
                                ref={search}
                                type="search"
                                value={query}
                                placeholder="Search"
                                onFocus={dismissSheet}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key !== 'Escape') return
                                    event.stopPropagation()
                                    if (query) setQuery('')
                                    else event.currentTarget.blur()
                                }}
                                aria-label="Search font families"
                                className="search-field order-last h-32 w-full min-w-0 rounded-control bg-raised px-8 text-ui @min-[46rem]/panel:order-none @min-[46rem]/panel:w-auto @min-[46rem]/panel:max-w-300 @min-[46rem]/panel:flex-1"
                            />

                            <div className="ml-auto flex items-center gap-8">
                                {demo && (
                                    <span className="rounded-control bg-raised px-8 py-4 text-label text-muted uppercase">
                                        Sample
                                    </span>
                                )}
                                <span className="hidden min-w-40 px-8 text-right text-label text-muted tabular-nums @min-[46rem]/panel:inline">
                                    {families.length}
                                </span>
                                <button
                                    onClick={toggle}
                                    aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
                                    className="group shrink-0 rounded-control p-8 text-muted transition-colors duration-fast hover:bg-raised hover:text-ink"
                                >
                                    <span className="block scale-100 transition-[scale] duration-fast motion-safe:group-active:scale-90 group-active:duration-0">
                                        {resolved === 'dark' ? <Sun /> : <Moon />}
                                    </span>
                                </button>
                            </div>
                        </header>

                            <div
                                role="tabpanel"
                                id={`panel-${tab}`}
                                aria-labelledby={`tab-${tab}`}
                                className="flex min-h-0 flex-1"
                            >
                                {tab === 'all' ? (
                                    <AllTab families={families} />
                                ) : (
                                    <FavoritesTab families={families} />
                                )}
                                <SpecimenPane />
                            </div>
                    </>
                )}
            </Shell>

            {import.meta.env.DEV && <Stats />}
        </>
    )
}
