export type Video = {
    id: string
    name: string
    url: string
    index: number
    fps?: number
    duration?: number
    width?: number
    height?: number
}

export type Annotation = {
    id: string
    videoId: string
    timestamp: number
    startFrame: number
    endFrame: number
    tags: string[]
    notes: string
    rating: number
}
