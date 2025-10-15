import { serve } from "bun"
import { $ } from "bun"
import index from "./index.html"
import { readdir } from "node:fs/promises"
import { join } from "node:path"
import type { Annotation } from "./types"

const VIDEOS_DIR = join(import.meta.dir, "../genshin_cosplay_bullet_time_rotate_shot")

/** Get annotation file path for a video */
function getAnnotationPath(videoId: string): string {
    return join(VIDEOS_DIR, `${videoId}.txt`)
}

/** Read annotations from file */
async function readAnnotations(videoId: string): Promise<Annotation[]> {
    const path = getAnnotationPath(videoId)
    const file = Bun.file(path)
    const exists = await file.exists()
    if (!exists) return []

    try {
        const text = await file.text()
        if (!text.trim()) return []
        return JSON.parse(text)
    } catch {
        return []
    }
}

/** Write annotations to file */
async function writeAnnotations(videoId: string, annotations: Annotation[]): Promise<void> {
    const path = getAnnotationPath(videoId)
    await Bun.write(path, JSON.stringify(annotations, null, 2))
}

/** Get video stats (annotation count, avg rating) */
async function getVideoStats(videoId: string) {
    const annotations = await readAnnotations(videoId)
    const tagCount = annotations.reduce((sum, a) => sum + a.tags.length, 0)
    const avgRating = annotations.length > 0 ? annotations.reduce((sum, a) => sum + (a.rating || 0), 0) / annotations.length : 0

    return {
        annotationCount: annotations.length,
        tagCount,
        avgRating: Math.round(avgRating * 10) / 10,
    }
}

/** Extract video metadata using ffprobe */
async function getVideoMetadata(videoPath: string) {
    try {
        const result =
            await $`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -show_entries format=duration -of json ${videoPath}`.json()

        const stream = result.streams?.[0]
        const format = result.format

        // Parse frame rate (e.g., "30/1" or "30000/1001")
        let fps = 30 // default fallback
        if (stream?.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split("/").map(Number)
            if (den && den > 0) fps = Math.round((num / den) * 100) / 100
        }

        // Get duration (prefer stream duration, fallback to format duration)
        const duration = parseFloat(stream?.duration || format?.duration || "0")

        return {
            duration,
            fps,
            width: stream?.width || 1920,
            height: stream?.height || 1080,
        }
    } catch (err) {
        console.error(`Failed to extract metadata for ${videoPath}:`, err)
        return {
            duration: 0,
            fps: 30,
            width: 1920,
            height: 1080,
        }
    }
}

const server = serve({
    routes: {
        "/api/videos": {
            async GET() {
                try {
                    const files = await readdir(VIDEOS_DIR)
                    const mp4Files = files.filter((f) => f.endsWith(".mp4"))

                    const videos = await Promise.all(
                        mp4Files.map(async (name, idx) => {
                            const id = name.replace(".mp4", "")
                            const videoPath = join(VIDEOS_DIR, name)
                            const [stats, metadata] = await Promise.all([getVideoStats(id), getVideoMetadata(videoPath)])
                            return {
                                id,
                                name,
                                url: `/videos/${name}`,
                                index: idx + 1,
                                ...stats,
                                ...metadata,
                            }
                        }),
                    )

                    return Response.json(videos)
                } catch (err) {
                    return Response.json({ error: "Failed to list videos" }, { status: 500 })
                }
            },
        },

        "/api/annotations/:videoId": {
            async GET(req) {
                const videoId = req.params.videoId
                const data = await readAnnotations(videoId)
                return Response.json(data)
            },
            async POST(req) {
                const videoId = req.params.videoId
                const body = await req.json()
                const id = crypto.randomUUID()
                const annotation = { id, videoId, ...body }

                const current = await readAnnotations(videoId)
                current.push(annotation)
                await writeAnnotations(videoId, current)

                return Response.json(annotation)
            },
        },

        "/api/annotations/:videoId/:annotationId": {
            async DELETE(req) {
                const { videoId, annotationId } = req.params
                const current = await readAnnotations(videoId)
                const filtered = current.filter((a) => a.id !== annotationId)
                await writeAnnotations(videoId, filtered)
                return Response.json({ success: true })
            },
            async PUT(req) {
                const { videoId, annotationId } = req.params
                const body = await req.json()
                const current = await readAnnotations(videoId)
                const idx = current.findIndex((a) => a.id === annotationId)
                if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 })
                current[idx] = { ...current[idx], ...body }
                await writeAnnotations(videoId, current)
                return Response.json(current[idx])
            },
        },

        "/videos/:filename": async (req) => {
            const filename = req.params.filename
            const file = Bun.file(join(VIDEOS_DIR, filename))
            const exists = await file.exists()
            if (!exists) return new Response("Not found", { status: 404 })
            return new Response(file)
        },

        // Serve index.html for all unmatched routes.
        "/*": index,
    },

    development: process.env.NODE_ENV !== "production" && {
        // Enable browser hot reloading in development
        hmr: true,

        // Echo console logs from the browser to the server
        console: true,
    },
})

console.log(`🚀 Server running at ${server.url}`)
