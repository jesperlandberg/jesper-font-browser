export function memoOne<A, R>(fn: (arg: A) => R): (arg: A) => R {
    let lastArg: A
    let lastResult: R
    let filled = false

    return (arg) => {
        if (!filled || arg !== lastArg) {
            lastArg = arg
            lastResult = fn(arg)
            filled = true
        }
        return lastResult
    }
}
