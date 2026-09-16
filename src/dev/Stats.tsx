import { useEffect, useState } from 'react'
import { stats } from '../lib/font-registry'

export function Stats() {
    const [value, setValue] = useState(stats)

    useEffect(() => {
        const id = setInterval(() => setValue(stats()), 500)
        return () => clearInterval(id)
    }, [])

    return (
        <p className="pointer-events-none fixed right-8 bottom-8 rounded-control bg-ink px-8 py-4 text-label text-ground">
            registered {value.registered} · hot {value.hot} · cold {value.cold}
        </p>
    )
}
