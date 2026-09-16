export function quoteFamily(name: string): string {
    return `"${name.replace(/[\\"]/g, '\\$&')}"`
}
