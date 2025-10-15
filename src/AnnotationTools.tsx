import { observer } from "mobx-react-lite"
import { makeAutoObservable } from "mobx"
import { useMemo } from "react"
import type { AppState } from "./AppState"

export type AnnotationToolsProps = {
    appState: AppState
}

class AnnotationToolsState {
    tags: string[] = []
    notes = ""
    tagInput = ""
    rating = 3

    constructor(public p: AnnotationToolsProps) {
        makeAutoObservable(this)
    }

    setRating(rating: number) {
        this.rating = rating
    }

    addTag() {
        const tag = this.tagInput.trim()
        if (tag && !this.tags.includes(tag)) {
            this.tags.push(tag)
            this.tagInput = ""
        }
    }

    removeTag(tag: string) {
        this.tags = this.tags.filter((t) => t !== tag)
    }

    setTagInput(value: string) {
        this.tagInput = value
    }

    setNotes(value: string) {
        this.notes = value
    }

    async saveAnnotation() {
        if (this.tags.length === 0 && !this.notes) return

        const [startFrame, endFrame] = this.p.appState.frameRange
        await this.p.appState.addAnnotation(this.p.appState.currentTime, startFrame, endFrame, this.tags, this.notes, this.rating)

        // Reset form
        this.tags = []
        this.notes = ""
        this.tagInput = ""
        this.rating = 3
    }

    deleteAnnotation(annotationId: string) {
        this.p.appState.deleteAnnotation(annotationId)
    }
}

export const AnnotationTools = observer((props: AnnotationToolsProps) => {
    const uist = useMemo(() => new AnnotationToolsState(props), [])

    const currentAnnotations = props.appState.annotations.filter(
        (a) => props.appState.currentFrame >= a.startFrame && props.appState.currentFrame <= a.endFrame,
    )

    return (
        <X.Stack gap="md">
            <X.Card withBorder>
                <X.Stack gap="sm">
                    <X.Text size="sm" fw={500}>
                        Add Annotation
                    </X.Text>

                    <X.Text size="xs" c="dimmed" mb="xs">
                        Current: Frame {props.appState.currentFrame} ({props.appState.currentTime.toFixed(2)}s)
                        <br />
                        Range: Frames {props.appState.frameRange[0]}-{props.appState.frameRange[1]}
                    </X.Text>

                    <div>
                        <X.Text size="xs" mb="xs">
                            Rating
                        </X.Text>
                        <X.Rating value={uist.rating} onChange={(val) => uist.setRating(val)} />
                    </div>

                    <X.Group gap="xs">
                        <X.TextInput
                            placeholder="Add tag..."
                            value={uist.tagInput}
                            onChange={(e) => uist.setTagInput(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    uist.addTag()
                                }
                            }}
                            style={{ flex: 1 }}
                        />
                        <X.Button onClick={() => uist.addTag()} size="sm">
                            Add
                        </X.Button>
                    </X.Group>

                    {uist.tags.length > 0 && (
                        <X.Group gap="xs">
                            {uist.tags.map((tag) => (
                                <X.Badge
                                    key={tag}
                                    rightSection={
                                        <span onClick={() => uist.removeTag(tag)} style={{ cursor: "pointer" }}>
                                            ×
                                        </span>
                                    }
                                >
                                    {tag}
                                </X.Badge>
                            ))}
                        </X.Group>
                    )}

                    <X.Textarea
                        placeholder="Add notes..."
                        value={uist.notes}
                        onChange={(e) => uist.setNotes(e.currentTarget.value)}
                        rows={3}
                    />

                    <X.Button onClick={() => uist.saveAnnotation()} disabled={uist.tags.length === 0 && !uist.notes} fullWidth>
                        Save Annotation
                    </X.Button>
                </X.Stack>
            </X.Card>

            <X.Card withBorder>
                <X.Stack gap="sm">
                    <X.Text size="sm" fw={500}>
                        All Annotations ({props.appState.annotations.length})
                    </X.Text>

                    <X.ScrollArea h={300}>
                        <X.Stack gap="xs">
                            {props.appState.annotations.length === 0 ? (
                                <X.Text size="sm" c="dimmed">
                                    No annotations yet
                                </X.Text>
                            ) : (
                                props.appState.annotations.map((annotation) => (
                                    <X.Card
                                        key={annotation.id}
                                        padding="xs"
                                        withBorder
                                        bg={currentAnnotations.includes(annotation) ? "blue.0" : undefined}
                                    >
                                        <X.Group justify="space-between" mb="xs">
                                            <div>
                                                <X.Text size="xs" fw={500}>
                                                    Frames {annotation.startFrame}-{annotation.endFrame}
                                                </X.Text>
                                                <X.Rating value={annotation.rating} readOnly size="xs" />
                                            </div>
                                            <X.ActionIcon
                                                size="sm"
                                                color="red"
                                                variant="subtle"
                                                onClick={() => uist.deleteAnnotation(annotation.id)}
                                            >
                                                ×
                                            </X.ActionIcon>
                                        </X.Group>

                                        {annotation.tags.length > 0 && (
                                            <X.Group gap="xs" mb="xs">
                                                {annotation.tags.map((tag) => (
                                                    <X.Badge key={tag} size="sm">
                                                        {tag}
                                                    </X.Badge>
                                                ))}
                                            </X.Group>
                                        )}

                                        {annotation.notes && (
                                            <X.Text size="xs" c="dimmed">
                                                {annotation.notes}
                                            </X.Text>
                                        )}
                                    </X.Card>
                                ))
                            )}
                        </X.Stack>
                    </X.ScrollArea>
                </X.Stack>
            </X.Card>
        </X.Stack>
    )
})
