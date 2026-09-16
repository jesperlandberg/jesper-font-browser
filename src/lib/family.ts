import type { Face, Family, FamilyId } from '../types'

export function ghostFamily(id: FamilyId): Family {
    return { id, name: id, faces: [], search: id.toLowerCase() }
}

export function isInstalled(family: Family): boolean {
    return family.faces.length > 0
}

export function previewFace(family: Family): Face | undefined {
    return family.faces.find((face) => face.weight === 400 && !face.italic) ?? family.faces[0]
}

export function optionId(id: FamilyId): string {
    return `family-${id.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`
}
