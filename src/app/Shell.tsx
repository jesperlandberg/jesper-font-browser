export function Shell({
    ref,
    children,
    sheet,
}: {
    ref?: React.Ref<HTMLDivElement>
    children: React.ReactNode
    sheet?: React.ReactNode
}) {
    return (
        <div className="grid h-dvh place-items-center p-8 narrow:p-24">
            <div
                ref={ref}
                className="@container/panel relative grid h-full max-h-1100 w-full max-w-1600"
            >
                <main className="animate-enter flex origin-top flex-col overflow-hidden rounded-panel border border-line bg-ground shadow-panel [scale:calc(1-0.0375*var(--sheet,0))] @wide/panel:[scale:1] [[data-animating]_&]:will-change-transform">
                    {children}
                </main>
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-panel">
                    {sheet}
                </div>
            </div>
        </div>
    )
}
