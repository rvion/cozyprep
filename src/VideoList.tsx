import { observer } from "mobx-react-lite"
import type { AppState } from "./AppState"

export type VideoListProps = {
    appState: AppState
}

export const VideoList = observer((p: VideoListProps) => {
    const { appState } = p

    if (appState.loading) {
        return (
            <div className="p-4">
                <X.Loader size="sm" />
            </div>
        )
    }

    if (appState.error) {
        return (
            <div className="p-4">
                <X.Text c="red" size="sm">
                    {appState.error}
                </X.Text>
            </div>
        )
    }

    return (
        <X.ScrollArea h="100%">
            <X.Stack gap={4} p="xs">
                {appState.videos.map(video => {
                    const hasAnnotations = (video as any).annotationCount > 0
                    return (
                        <X.Card
                            key={video.id}
                            padding="xs"
                            withBorder
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => appState.selectVideo(video)}
                            bg={appState.selectedVideo?.id === video.id ? "blue.0" : undefined}
                        >
                            <X.Group justify="space-between" mb={2}>
                                <X.Text size="xs" fw={600}>
                                    Video {video.index}
                                </X.Text>
                                {hasAnnotations && (
                                    <X.Rating
                                        value={(video as any).avgRating || 0}
                                        readOnly
                                        size="xs"
                                        count={5}
                                    />
                                )}
                            </X.Group>

                            <X.Text size="xs" c="dimmed" truncate="end" mb={4}>
                                {video.name}
                            </X.Text>

                            <X.Group gap="xs">
                                <X.Badge size="xs" variant="light" color={hasAnnotations ? "blue" : "gray"}>
                                    {(video as any).annotationCount || 0} annotations
                                </X.Badge>
                                <X.Badge size="xs" variant="light" color={(video as any).tagCount > 0 ? "green" : "gray"}>
                                    {(video as any).tagCount || 0} tags
                                </X.Badge>
                            </X.Group>
                        </X.Card>
                    )
                })}
            </X.Stack>
        </X.ScrollArea>
    )
})
