import { useFontsStore } from '../store/fonts'

export function Gate() {
    const status = useFontsStore((state) => state.status)
    const error = useFontsStore((state) => state.error)
    const load = useFontsStore((state) => state.load)
    const demoFonts = useFontsStore((state) => state.demoFonts)

    const blocked = status === 'unsupported' || status === 'denied'

    return (
        <div className="grid flex-1 place-content-center justify-items-center gap-16 px-24 text-center">
            <p className="max-w-360 text-strong text-muted">
                {status === 'unsupported'
                    ? 'Reading the fonts on your computer needs a desktop Chrome or Edge.'
                    : status === 'denied'
                      ? 'Font access is blocked for this site. Allow it in the padlock menu, then try again.'
                      : 'Reads the fonts installed on this computer. Nothing leaves the browser.'}
            </p>

            <div className="flex flex-col items-center gap-12 @min-[38rem]/panel:flex-row">
                {status !== 'unsupported' && (
                    <button
                        onClick={load}
                        disabled={status === 'loading'}
                        className="group disabled:opacity-50"
                    >
                        <span className="block scale-100 rounded-control bg-ink px-16 py-8 text-ui text-ground transition-[scale,background-color] duration-fast group-hover:bg-ink/85 motion-safe:group-active:scale-[0.97] group-active:duration-0">
                            {status === 'loading' ? 'Reading…' : status === 'denied' ? 'Try again' : 'Show my fonts'}
                        </span>
                    </button>
                )}

                <button
                    onClick={demoFonts}
                    className="group"
                    aria-label="Browse a sample set of fonts instead"
                >
                    <span
                        className={`block scale-100 rounded-control px-16 py-8 text-ui transition-[scale,background-color,color] duration-fast motion-safe:group-active:scale-[0.97] group-active:duration-0 ${
                            blocked
                                ? 'bg-raised text-ink group-hover:bg-line'
                                : 'text-muted group-hover:bg-raised group-hover:text-ink'
                        }`}
                    >
                        Browse sample fonts
                    </span>
                </button>
            </div>

            {error && (
                <p role="alert" className="text-ui text-muted">
                    {error}
                </p>
            )}
        </div>
    )
}
