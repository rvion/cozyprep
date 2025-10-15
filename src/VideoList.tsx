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
            <X.Stack gap="xs" p="sm">
                {appState.videos.map(video => (
                    <X.Card
                        key={video.id}
                        padding="sm"
                        withBorder
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => appState.selectVideo(video)}
                        bg={appState.selectedVideo?.id === video.id ? "blue.0" : undefined}
                    >
                        <X.Text size="sm" fw={500}>
                            Video {video.index}
                        </X.Text>
                        <X.Text size="xs" c="dimmed">
                            {video.name}
                        </X.Text>
                    </X.Card>
                ))}
            </X.Stack>
        </X.ScrollArea>
    )
})
