import { makeAutoObservable, runInAction } from "mobx"
import type { Video, Annotation } from "./types"

export class AppState {
    videos: Video[] = []
    selectedVideo: Video | null = null
    annotations: Annotation[] = []
    loading = false
    error: string | null = null
    currentTime = 0
    currentFrame = 0
    frameRange: [number, number] = [0, 10]

    constructor() {
        makeAutoObservable(this)
        this.loadVideos()
    }

    setCurrentTime(time: number, frame: number) {
        this.currentTime = time
        this.currentFrame = frame
    }

    setFrameRange(range: [number, number]) {
        this.frameRange = range
    }

    async loadVideos() {
        this.loading = true
        this.error = null
        try {
            const res = await fetch("/api/videos")
            if (!res.ok) throw new Error("Failed to load videos")
            const data = await res.json()
            runInAction(() => {
                this.videos = data
                this.loading = false
                if (data.length > 0 && !this.selectedVideo) {
                    this.selectVideo(data[0])
                }
            })
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Unknown error"
                this.loading = false
            })
        }
    }

    selectVideo(video: Video) {
        this.selectedVideo = video
        this.loadAnnotations(video.id)
    }

    async loadAnnotations(videoId: string) {
        try {
            const res = await fetch(`/api/annotations/${videoId}`)
            if (!res.ok) throw new Error("Failed to load annotations")
            const data = await res.json()
            runInAction(() => {
                this.annotations = data
            })
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Unknown error"
            })
        }
    }

    async addAnnotation(
        timestamp: number,
        startFrame: number,
        endFrame: number,
        tags: string[],
        notes: string,
        rating: number
    ) {
        if (!this.selectedVideo) return

        try {
            const res = await fetch(`/api/annotations/${this.selectedVideo.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timestamp, startFrame, endFrame, tags, notes, rating }),
            })
            if (!res.ok) throw new Error("Failed to add annotation")
            const data = await res.json()
            runInAction(() => {
                this.annotations.push(data)
            })
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Unknown error"
            })
        }
    }

    async deleteAnnotation(annotationId: string) {
        if (!this.selectedVideo) return

        try {
            const res = await fetch(`/api/annotations/${this.selectedVideo.id}/${annotationId}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete annotation")
            runInAction(() => {
                this.annotations = this.annotations.filter(a => a.id !== annotationId)
            })
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Unknown error"
            })
        }
    }

    async updateAnnotation(annotationId: string, updates: Partial<Annotation>) {
        if (!this.selectedVideo) return

        try {
            const res = await fetch(`/api/annotations/${this.selectedVideo.id}/${annotationId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            })
            if (!res.ok) throw new Error("Failed to update annotation")
            const data = await res.json()
            runInAction(() => {
                const idx = this.annotations.findIndex(a => a.id === annotationId)
                if (idx !== -1) {
                    this.annotations[idx] = data
                }
            })
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Unknown error"
            })
        }
    }
}
