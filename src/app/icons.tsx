export function DragHandle() {
    return (
        <svg viewBox="0 0 6 14" fill="currentColor" aria-hidden="true" className="h-14 w-auto">
            <circle cx="1" cy="1" r="1" />
            <circle cx="5" cy="1" r="1" />
            <circle cx="1" cy="7" r="1" />
            <circle cx="5" cy="7" r="1" />
            <circle cx="1" cy="13" r="1" />
            <circle cx="5" cy="13" r="1" />
        </svg>
    )
}

const STAR = 'M12 2.4l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.46l-5.9 3.1 1.12-6.57L2.45 9.34l6.6-.96z'

export function Star({ filled }: { filled: boolean }) {
    return (
        <svg
            viewBox="2 2 20 20"
            aria-hidden="true"
            className="h-16 w-auto"
            {...(filled
                ? { fill: 'currentColor' }
                : { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' as const })}
        >
            <path d={STAR} />
        </svg>
    )
}

const RAYS = [
    'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4',
    'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4',
]

export function Sun() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            aria-hidden="true"
            className="h-16 w-auto"
        >
            <circle cx="12" cy="12" r="4.2" />
            {RAYS.map((d) => (
                <path key={d} d={d} />
            ))}
        </svg>
    )
}

export function Moon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-16 w-auto"
        >
            <path d="M20.5 13.3A8.5 8.5 0 1 1 10.7 3.5a6.6 6.6 0 0 0 9.8 9.8z" />
        </svg>
    )
}
