import { Specimen } from './Specimen'

export function SpecimenPane() {
    return (
        <aside className="hidden min-w-0 flex-1 flex-col border-l border-line @wide/panel:flex">
            <Specimen />
        </aside>
    )
}
