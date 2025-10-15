import { observer } from "mobx-react-lite"
import { makeAutoObservable, reaction } from "mobx"
import { useMemo } from "react"
import type { AppState } from "./AppState"
import type { Annotation } from "./types"

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
            () => {
                this.debouncedSave()
            }
        )
    }

    /** Get or create annotation for current frame range */
    get currentAnnotation(): Annotation | null {
        const [startFrame, endFrame] = this.p.appState.frameRange

        // Find existing annotation matching this frame range
        const existing = this.p.appState.annotations.find(
            (a) => a.startFrame === startFrame && a.endFrame === endFrame
        )

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
        }
    }

    removeTag(tag: string) {
        const ann = this.currentAnnotation
        if (ann) {
            this.p.appState.updateAnnotation(ann.id, { tags: ann.tags.filter((t) => t !== tag) })
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
        }
    }

    /** Ensure an annotation exists for the current frame range */
    ensureAnnotationExists() {
        if (!this.currentAnnotation) {
            const [startFrame, endFrame] = this.p.appState.frameRange
            this.p.appState.addAnnotation(
                this.p.appState.currentTime,
                startFrame,
                endFrame,
                [],
                "",
                3
            )
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
        <X.Card withBorder>
            <X.Stack gap="sm">
                <X.Group justify="space-between" align="center">
                    <X.Text size="sm" fw={500}>
                        Annotation Editor
                    </X.Text>
                    {uist.currentAnnotation && (
                        <X.ActionIcon
                            size="sm"
                            color="red"
                            variant="subtle"
                            onClick={() => uist.clearAnnotation()}
                            title="Clear annotation"
                        >
                            ×
                        </X.ActionIcon>
                    )}
                </X.Group>

                <X.Text size="xs" c="dimmed">
                    Range: Frames {props.appState.frameRange[0]}-{props.appState.frameRange[1]}
                    {uist.currentAnnotation ? " (editing)" : " (no annotation)"}
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
                        size="xs"
                    />
                    <X.Button onClick={() => uist.addTag()} size="xs">
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
                    rows={4}
                    size="xs"
                />
            </X.Stack>
        </X.Card>
    )
})
