export type Video = {
    id: string
    name: string
    url: string
    index: number
}

export type Annotation = {
    id: string
    videoId: string
    timestamp: number
    frame: number
    tags: string[]
    notes: string
}
