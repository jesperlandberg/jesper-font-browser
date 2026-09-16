// The Local Font Access API is not in lib.dom yet (Chromium 103+, desktop only).

interface FontData {
    readonly postscriptName: string
    readonly fullName: string
    readonly family: string
    readonly style: string
    blob(): Promise<Blob>
}

interface Window {
    queryLocalFonts?: (options?: { postscriptNames?: string[] }) => Promise<FontData[]>
}
