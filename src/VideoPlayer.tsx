import { observer } from "mobx-react-lite"
import { usePropsAsStableObservableObject } from "./usePropsAsStableObservableObject"
import { makeAutoObservable } from "mobx"
import { useMemo, useRef, useEffect } from "react"
import type { AppState } from "./AppState"

export type VideoPlayerProps = {
    appState: AppState
}

class VideoPlayerState {
    currentTime = 0
    duration = 0
    playing = false
    fps = 30 // assume 30fps

    constructor(public p: VideoPlayerProps) {
        makeAutoObservable(this)
    }

    get currentFrame(): number {
        return Math.floor(this.currentTime * this.fps)
    }

    get totalFrames(): number {
        return Math.floor(this.duration * this.fps)
    }

    setCurrentTime(time: number) {
        this.currentTime = time
        // Use queueMicrotask to defer the appState update
        queueMicrotask(() => {
            this.p.appState.setCurrentTime(time, this.currentFrame)
        })
    }

    setDuration(duration: number) {
        this.duration = duration
    }

    togglePlay() {
        this.playing = !this.playing
    }

    seekToFrame(frame: number) {
        const time = frame / this.fps
        this.setCurrentTime(Math.min(time, this.duration))
    }

    nextFrame() {
        this.seekToFrame(this.currentFrame + 1)
    }

    prevFrame() {
        this.seekToFrame(Math.max(0, this.currentFrame - 1))
    }
}

export const VideoPlayer = observer((props: VideoPlayerProps) => {
    const uist = useMemo(() => new VideoPlayerState(props), [])
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleTimeUpdate = () => {
            uist.setCurrentTime(video.currentTime)
        }

        const handleLoadedMetadata = () => {
            uist.setDuration(video.duration)
        }

        video.addEventListener("timeupdate", handleTimeUpdate)
        video.addEventListener("loadedmetadata", handleLoadedMetadata)

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate)
            video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        }
    }, [uist])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (uist.playing) {
            video.play()
        } else {
            video.pause()
        }
    }, [uist.playing])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (Math.abs(video.currentTime - uist.currentTime) > 0.1) {
            video.currentTime = uist.currentTime
        }
    }, [uist.currentTime])

    if (!props.appState.selectedVideo) {
        return (
            <X.Center h="100%">
                <X.Text c="dimmed">Select a video to start</X.Text>
            </X.Center>
        )
    }

    return (
        <X.Stack gap="md" h="100%">
            <div className="relative bg-black rounded overflow-hidden">
                <video
                    ref={videoRef}
                    src={props.appState.selectedVideo.url}
                    className="w-full"
                    style={{ maxHeight: "60vh" }}
                />
            </div>

            <X.Stack gap="sm">
                <X.Group justify="space-between">
                    <X.Text size="sm" fw={500}>
                        Frame: {uist.currentFrame} / {uist.totalFrames}
                    </X.Text>
                    <X.Text size="sm" c="dimmed">
                        {uist.currentTime.toFixed(2)}s / {uist.duration.toFixed(2)}s
                    </X.Text>
                </X.Group>

                <X.Slider
                    min={0}
                    max={uist.duration}
                    step={1 / uist.fps}
                    value={uist.currentTime}
                    onChange={val => uist.setCurrentTime(val)}
                />

                <X.Group justify="center" gap="sm">
                    <X.ActionIcon
                        variant="filled"
                        onClick={() => uist.prevFrame()}
                        size="lg"
                    >
                        ⏮
                    </X.ActionIcon>
                    <X.ActionIcon
                        variant="filled"
                        onClick={() => uist.togglePlay()}
                        size="xl"
                    >
                        {uist.playing ? "⏸" : "▶"}
                    </X.ActionIcon>
                    <X.ActionIcon
                        variant="filled"
                        onClick={() => uist.nextFrame()}
                        size="lg"
                    >
                        ⏭
                    </X.ActionIcon>
                </X.Group>
            </X.Stack>
        </X.Stack>
    )
})
