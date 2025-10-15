import { observer } from "mobx-react-lite"
import { usePropsAsStableObservableObject } from "./usePropsAsStableObservableObject"
import { makeAutoObservable, reaction } from "mobx"
import { useMemo, useRef, useEffect } from "react"
import type { AppState } from "./AppState"
import { AnnotationTools } from "./AnnotationTools"

export type VideoPlayerProps = {
    appState: AppState
}

class VideoPlayerState {
    currentTime = 0
    duration = 0
    playing = false
    fps = 30

    constructor(public p: VideoPlayerProps) {
        makeAutoObservable(this)

        // React to video changes and update metadata
        reaction(
            () => p.appState.selectedVideo,
            (video) => {
                if (video?.duration) this.duration = video.duration
                if (video?.fps) this.fps = video.fps
                this.currentTime = 0
                this.playing = false
            },
            { fireImmediately: true }
        )
    }

    setFps(fps: number) {
        this.fps = Math.max(1, Math.min(120, fps))
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
            console.log(
                `[VideoPlayer] Loaded metadata: duration=${video.duration}s, videoWidth=${video.videoWidth}, videoHeight=${video.videoHeight}`,
            )
            uist.setDuration(video.duration)
        }

        video.addEventListener("timeupdate", handleTimeUpdate)
        video.addEventListener("loadedmetadata", handleLoadedMetadata)

        // Check if metadata is already loaded (readyState >= 1 means HAVE_METADATA)
        if (video.readyState >= 1) {
            console.log(`[VideoPlayer] Metadata already loaded, using existing duration=${video.duration}s`)
            uist.setDuration(video.duration)
        }

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

        // Use MobX reaction to sync video.currentTime with uist.currentTime
        const dispose = reaction(
            () => uist.currentTime,
            (time) => {
                if (Math.abs(video.currentTime - time) > 0.01) {
                    video.currentTime = time
                }
            }
        )

        return dispose
    }, [uist])

    if (!props.appState.selectedVideo) {
        return (
            <X.Center h="100%">
                <X.Text c="dimmed">Select a video to start</X.Text>
            </X.Center>
        )
    }

    return (
        <X.Stack gap="md" h="100%">
            {/* Metadata and Controls Section */}
            <X.Stack gap="sm">
                <X.Group justify="space-between" align="center">
                    <X.Stack gap={2}>
                        <X.Text size="sm" fw={500}>
                            Frame: {uist.currentFrame} / {uist.totalFrames}
                        </X.Text>
                        <X.Text size="xs" c="dimmed">
                            {props.appState.selectedVideo?.width || "?"}x{props.appState.selectedVideo?.height || "?"} @ {props.appState.selectedVideo?.fps?.toFixed(2) || "?"}fps, {props.appState.selectedVideo?.duration?.toFixed(2) || "?"}s
                        </X.Text>
                    </X.Stack>
                    <X.Group gap="xs">
                        <X.NumberInput
                            value={uist.fps}
                            onChange={(val) => uist.setFps(val as number)}
                            min={1}
                            max={120}
                            w={80}
                            size="xs"
                            label="FPS"
                            styles={{ label: { fontSize: "10px" } }}
                        />
                        <X.Text size="sm" c="dimmed">
                            {uist.currentTime.toFixed(2)}s / {uist.duration.toFixed(2)}s
                        </X.Text>
                    </X.Group>
                </X.Group>

                <div>
                    <X.Text size="xs" c="dimmed" mb={4}>
                        Playback Progress
                    </X.Text>
                    <X.Slider
                        min={0}
                        max={uist.duration}
                        step={1 / uist.fps}
                        value={uist.currentTime}
                        onChange={(val) => uist.setCurrentTime(val)}
                    />
                </div>

                <div>
                    <X.Text size="xs" c="dimmed" mb={4}>
                        Annotation Range: Frames {props.appState.frameRange[0]} - {props.appState.frameRange[1]}
                    </X.Text>
                    <X.RangeSlider
                        min={0}
                        max={uist.totalFrames}
                        step={1}
                        value={props.appState.frameRange}
                        onChange={(val) => props.appState.setFrameRange(val)}
                        marks={[{ value: uist.currentFrame, label: `${uist.currentFrame}` }]}
                    />
                </div>

                <X.Group justify="center" gap="sm">
                    <X.ActionIcon variant="filled" onClick={() => uist.prevFrame()} size="lg">
                        ⏮
                    </X.ActionIcon>
                    <X.ActionIcon variant="filled" onClick={() => uist.togglePlay()} size="xl">
                        {uist.playing ? "⏸" : "▶"}
                    </X.ActionIcon>
                    <X.ActionIcon variant="filled" onClick={() => uist.nextFrame()} size="lg">
                        ⏭
                    </X.ActionIcon>
                </X.Group>
            </X.Stack>

            {/* Annotation Editor */}
            <AnnotationTools appState={props.appState} />

            {/* Video Player */}
            <div className="relative bg-black rounded overflow-hidden">
                <video
                    ref={videoRef}
                    src={props.appState.selectedVideo.url}
                    className="w-full"
                    style={{ maxHeight: "40vh" }}
                    preload="metadata"
                />
            </div>
        </X.Stack>
    )
})
