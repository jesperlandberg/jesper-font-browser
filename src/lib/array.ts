export function move<T>(items: readonly T[], from: number, to: number): T[] {
    if (from === to) return items as T[]

    const next = [...items]
    const [item] = next.splice(from, 1)
    if (item !== undefined) next.splice(to, 0, item)
    return next
}
