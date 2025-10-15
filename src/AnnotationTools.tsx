import { observer } from "mobx-react-lite"
import { makeAutoObservable, reaction } from "mobx"
import { useMemo } from "react"
import type { AppState } from "./AppState"
import type { Annotation } from "./types"
import { IconTrash, IconPlus, IconX } from "@tabler/icons-react"
import { notifications } from "@mantine/notifications"

export type AnnotationToolsProps = {
    appState: AppState
}

class AnnotationToolsState {
    tagInput = ""
    saveTimeout: NodeJS.Timeout | null = null

    constructor(public p: AnnotationToolsProps) {
        makeAutoObservable(this)

        // Auto-save when annotation data changes
        reaction(
            () => this.currentAnnotation,
            () => void this.debouncedSave(),
        )
    }

    /** Get or create annotation for current frame range */
    get currentAnnotation(): Annotation | null {
        const [startFrame, endFrame] = this.p.appState.frameRange

        // Find existing annotation matching this frame range
        const existing = this.p.appState.annotations.find((a) => a.startFrame === startFrame && a.endFrame === endFrame)

        return existing || null
    }

    get tags(): string[] {
        return this.currentAnnotation?.tags || []
    }

    get notes(): string {
        return this.currentAnnotation?.notes || ""
    }

    get rating(): number {
        return this.currentAnnotation?.rating || 3
    }

    setRating(rating: number) {
        this.ensureAnnotationExists()
        const ann = this.currentAnnotation
        if (ann) {
            this.p.appState.updateAnnotation(ann.id, { rating })
            this.showSavedNotification()
        }
    }

    addTag() {
        const tag = this.tagInput.trim()
        if (!tag) return

        this.ensureAnnotationExists()
        const ann = this.currentAnnotation
        if (ann && !ann.tags.includes(tag)) {
            this.p.appState.updateAnnotation(ann.id, { tags: [...ann.tags, tag] })
            this.tagInput = ""
            this.showSavedNotification()
        }
    }

    removeTag(tag: string) {
        const ann = this.currentAnnotation
        if (ann) {
            this.p.appState.updateAnnotation(ann.id, { tags: ann.tags.filter((t) => t !== tag) })
            this.showSavedNotification()
        }
    }

    setTagInput(value: string) {
        this.tagInput = value
    }

    setNotes(value: string) {
        this.ensureAnnotationExists()
        const ann = this.currentAnnotation
        if (ann) {
            this.p.appState.updateAnnotation(ann.id, { notes: value })
            this.showSavedNotification()
        }
    }

    showSavedNotification() {
        notifications.show({
            title: "Saved",
            message: "Annotation saved successfully",
            color: "green",
            autoClose: 2000,
        })
    }

    /** Ensure an annotation exists for the current frame range */
    ensureAnnotationExists() {
        if (!this.currentAnnotation) {
            const [startFrame, endFrame] = this.p.appState.frameRange
            this.p.appState.addAnnotation(this.p.appState.currentTime, startFrame, endFrame, [], "", 3)
        }
    }

    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout)
        // Auto-save is handled by updateAnnotation calls, no need for additional save
    }

    clearAnnotation() {
        const ann = this.currentAnnotation
        if (ann) {
            this.p.appState.deleteAnnotation(ann.id)
        }
    }
}

export const AnnotationTools = observer((props: AnnotationToolsProps) => {
    const uist = useMemo(() => new AnnotationToolsState(props), [])

    return (
        <X.Card withBorder padding="xs">
            <X.Stack gap="xs">
                <X.Group justify="space-between" align="center">
                    <X.Group gap={4}>
                        <X.Text size="xs" fw={600}>
                            Annotation
                        </X.Text>
                        <X.Text size="xs" c="dimmed">
                            {props.appState.frameRange[0]}-{props.appState.frameRange[1]}
                            {uist.currentAnnotation ? " (editing)" : ""}
                        </X.Text>
                    </X.Group>
                    {uist.currentAnnotation && (
                        <X.ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() => uist.clearAnnotation()}
                            title="Clear annotation"
                        >
                            <IconTrash size={14} />
                        </X.ActionIcon>
                    )}
                </X.Group>

                <X.Group gap="xs" align="center">
                    <X.Text size="xs" c="dimmed" style={{ minWidth: 40 }}>
                        Rating
                    </X.Text>
                    <X.Rating value={uist.rating} onChange={(val) => uist.setRating(val)} size="xs" />
                </X.Group>

                <X.Group gap={4}>
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
                        size="xs"
                    />
                    <X.ActionIcon onClick={() => uist.addTag()} size="lg" variant="filled">
                        <IconPlus size={16} />
                    </X.ActionIcon>
                </X.Group>

                {uist.tags.length > 0 && (
                    <X.Group gap={4}>
                        {uist.tags.map((tag) => (
                            <X.Badge
                                key={tag}
                                size="sm"
                                rightSection={
                                    <X.ActionIcon
                                        size="xs"
                                        color="gray"
                                        radius="xl"
                                        variant="transparent"
                                        onClick={() => uist.removeTag(tag)}
                                    >
                                        <IconX size={10} />
                                    </X.ActionIcon>
                                }
                            >
                                {tag}
                            </X.Badge>
                        ))}
                    </X.Group>
                )}

                <X.Textarea
                    placeholder="Notes..."
                    value={uist.notes}
                    onChange={(e) => uist.setNotes(e.currentTarget.value)}
                    rows={2}
                    size="xs"
                />
            </X.Stack>
        </X.Card>
    )
})
