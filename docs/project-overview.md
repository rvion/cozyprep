# Video Annotation Tagger - Project Specification

## Overview

A web-based video annotation tool for tagging and annotating video frames. Built with Bun, React, MobX, and Mantine UI.

## Purpose

Enable frame-by-frame video annotation with tags and notes. Videos are stored locally in `genshin_cosplay_bullet_time_rotate_shot/` directory (15 MP4 files). Annotations are stored in-memory on the server.

## Tech Stack

- **Runtime**: Bun (server + bundler)
- **Backend**: Bun.serve with REST API
- **Frontend**: React 19
- **State Management**: MobX 6 + mobx-react-lite
- **UI Framework**: Mantine 8
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript (strict mode)

## Architecture

### Backend (src/index.tsx)

Bun server with static file serving and REST API.

**Routes:**
- `GET /api/videos` - List all available videos
- `GET /api/annotations/:videoId` - Get annotations for a video
- `POST /api/annotations/:videoId` - Create new annotation
- `PUT /api/annotations/:videoId/:annotationId` - Update annotation
- `DELETE /api/annotations/:videoId/:annotationId` - Delete annotation
- `GET /videos/:filename` - Serve video files
- `GET /*` - Serve index.html (SPA)

**Storage:**
- File-based annotation storage (.txt files alongside videos containing JSON)
- Videos served directly from filesystem
- Each video has a corresponding `<video-name>.txt` file for persistent annotations

### Frontend Architecture

**State Management:**
- Single global `AppState` class (MobX)
- Each component has local `ComponentState` class (MobX)
- Components use `observer` HOC for reactivity
- Props stabilized with `usePropsAsStableObservableObject`

**Component Structure:**
```
App (root)
├── VideoList (left sidebar, 300px)
└── VideoPlayer (main, max 800px width)
    ├── Metadata & Controls (top)
    ├── AnnotationTools (middle, embedded)
    └── Video Element (bottom)
```

## Data Models

### Video
```typescript
{
  id: string           // filename without .mp4
  name: string         // full filename
  url: string          // /videos/{name}
  index: number        // 1-based index for display
}
```

### Annotation
```typescript
{
  id: string           // UUID
  videoId: string      // video ID this belongs to
  timestamp: number    // seconds into video
  startFrame: number   // start frame of annotation range
  endFrame: number     // end frame of annotation range
  tags: string[]       // array of tag strings
  notes: string        // freeform text notes
  rating: number       // 1-5 star rating
}
```

## Component Specifications

### AppState (src/AppState.ts)

**Purpose**: Global application state manager

**State:**
- `videos: Video[]` - all available videos
- `selectedVideo: Video | null` - currently selected video
- `annotations: Annotation[]` - annotations for selected video
- `currentTime: number` - current playback time
- `currentFrame: number` - current frame number
- `frameRange: [number, number]` - annotation frame range (start, end)
- `loading: boolean` - loading state
- `error: string | null` - error messages

**Methods:**
- `loadVideos()` - Fetch videos from API (includes stats), auto-select first
- `selectVideo(video)` - Change selected video, load its annotations
- `loadAnnotations(videoId)` - Fetch annotations for video
- `addAnnotation(timestamp, startFrame, endFrame, tags, notes, rating)` - Create annotation
- `deleteAnnotation(annotationId)` - Remove annotation
- `updateAnnotation(annotationId, updates)` - Modify annotation
- `setCurrentTime(time, frame)` - Update playback position
- `setFrameRange(range)` - Update annotation frame range

### VideoList (src/VideoList.tsx)

**Purpose**: Display list of available videos, allow selection

**Props:**
- `appState: AppState` - global state reference

**UI:**
- Compact, dense scrollable list
- Each card shows:
  - Video index and filename (truncated)
  - Average rating (stars, only if annotated)
  - Annotation count badge
  - Tag count badge
  - Color-coded badges (blue for annotations, green for tags, gray for none)
- Highlights selected video (blue background)
- Click to select video
- Shows loader when loading
- Shows error if load fails

### VideoPlayer (src/VideoPlayer.tsx)

**Purpose**: Video playback with frame-precise controls

**Props:**
- `appState: AppState` - global state reference

**Local State:**
- `currentTime: number` - video playback position
- `duration: number` - total video duration from video metadata
- `playing: boolean` - play/pause state
- `fps: number` - frames per second (configurable, defaults to 30)

**Computed:**
- `currentFrame` - Math.floor(currentTime * fps)
- `totalFrames` - Math.floor(duration * fps)

**UI Elements:**
- HTML5 `<video>` element
- Frame/time display with FPS input (NumberInput, 1-120 range)
- Playback progress slider (Slider, step = 1/fps)
- Annotation frame range selector (RangeSlider, 0-totalFrames)
  - Shows current frame marker
  - Independent of playback position
  - Spans 0 to totalFrames
- Transport controls:
  - Previous frame button (⏮)
  - Play/pause button (▶/⏸)
  - Next frame button (⏭)

**Behavior:**
- Updates `appState.currentTime/currentFrame` on video time changes
- Syncs video element with UI state changes
- Auto-loads metadata when video loads

### AnnotationTools (src/AnnotationTools.tsx)

**Purpose**: Single continuously editable annotation tied to current frame range

**Props:**
- `appState: AppState` - global state reference

**Local State:**
- `tagInput: string` - tag input field value
- `currentAnnotation` (computed) - finds annotation matching current frameRange or returns null

**Computed Properties:**
- `tags` - tags from currentAnnotation or empty array
- `notes` - notes from currentAnnotation or empty string
- `rating` - rating from currentAnnotation or default 3

**Behavior:**
- **Auto-creates** annotation when user starts editing (adds tag, types notes, or changes rating)
- **Auto-saves** all changes immediately via updateAnnotation API
- **Frame-range based**: annotation is tied to `appState.frameRange` (not current frame)
- Changing frameRange switches to different annotation (if one exists) or shows blank editor
- Clear button (×) deletes current annotation

**UI Elements:**
- Header with title and clear button
- Frame range display with "(editing)" or "(no annotation)" status
- Rating selector (1-5 stars)
- Tag input + "Add" button (Enter key supported)
- Tag badges with remove (×) button
- Notes textarea (4 rows)

**No "Save" button** - all changes are immediately persisted to backend

## UI Layout

**AppShell Configuration:**
- Header: 60px height, "Video Annotation Tool" title
- Navbar: 300px width, breakpoint at "sm", contains VideoList
- Main: Single column, max 800px width, contains VideoPlayer
- Padding: "md" throughout

**VideoPlayer Layout (top to bottom):**
1. Metadata & Controls Section
   - Frame counter and video metadata (resolution, fps, duration)
   - FPS input and time display
   - Playback progress slider
   - Annotation frame range selector
   - Transport controls (prev/play/next)
2. Annotation Editor (embedded AnnotationTools component)
3. Video element (max height 40vh)

**Responsive:**
- Navbar collapses on small screens
- All UI elements grouped in top-left portion of screen
- Video scales to fit container

## Development

**Start Server:**
```bash
bun --hot src/index.tsx
```

**Build:**
```bash
bun build src/index.html
```

**Key Files:**
- `src/index.tsx` - Server entry point
- `src/index.html` - HTML template
- `src/frontend.tsx` - React mount point
- `src/App.tsx` - Root component
- `src/setup.ts` - Global Mantine/Hooks setup
- `src/types.ts` - Shared TypeScript types
- `src/usePropsAsStableObservableObject.ts` - MobX utility hook

## Recent Updates

- ✅ **Backend metadata extraction** - ffprobe extracts duration, fps, width, height on video load
- ✅ **Single continuously editable annotation** - frame-range based, auto-saves, no "Save" button
- ✅ **Reorganized UI layout** - all controls grouped at top-left (metadata → annotation editor → video)
- ✅ **Fixed playback slider bug** - MobX reaction syncs video.currentTime with slider changes
- ✅ File-based persistent storage (annotations saved to .txt files)
- ✅ Frame range selection (start/end frames with RangeSlider)
- ✅ Rating system (1-5 stars per annotation)
- ✅ Video statistics in list (annotation count, tag count, avg rating)
- ✅ Configurable FPS (NumberInput, 1-120)
- ✅ Dense video list design with badges

## Future Enhancements

- Export annotations to JSON/CSV
- Video upload support
- Annotation search/filter
- Keyboard shortcuts (space to play/pause, arrow keys for frame stepping)
- Frame thumbnails
- Annotation timeline visualization
- Batch annotation editing
- SQLite migration for better query performance
