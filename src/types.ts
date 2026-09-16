export type FamilyId = string

export type Face = {
    postscriptName: string
    fullName: string
    style: string
    weight: number
    italic: boolean
}

export type Family = {
    id: FamilyId
    name: string
    faces: Face[]
    search: string
}
