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
├── VideoList (left sidebar)
├── VideoPlayer (center, 8 cols)
└── AnnotationTools (right, 4 cols)
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

**Purpose**: Create, view, and manage annotations

**Props:**
- `appState: AppState` - global state reference

**Local State:**
- `tags: string[]` - tags for new annotation
- `notes: string` - notes for new annotation
- `tagInput: string` - tag input field value
- `rating: number` - 1-5 star rating (defaults to 3)

**Note:** Frame range is now stored in AppState (accessed via `appState.frameRange`) and displayed in VideoPlayer for better UX

**UI Sections:**

1. **Add Annotation Card**
   - Shows current frame/timestamp and selected range
   - Rating selector (1-5 stars)
   - Tag input + "Add" button (Enter key supported)
   - Tag badges with remove (×) button
   - Notes textarea
   - "Save Annotation" button (disabled if empty)

   **Note:** Frame range selection moved to VideoPlayer for better visual alignment with playback controls

2. **All Annotations Card**
   - Scrollable list (300px height)
   - Shows annotation count
   - Each annotation shows:
     - Frame range (startFrame-endFrame)
     - Star rating (read-only)
     - Delete button (×)
     - Tag badges
     - Notes text
   - Highlights annotations when current frame is within their range (blue background)

**Behavior:**
- Clears form after saving annotation
- Filters annotations to show those near current frame
- Real-time updates via MobX reactivity

## UI Layout

**AppShell Configuration:**
- Header: 60px height, "Video Annotation Tool" title
- Navbar: 300px width, breakpoint at "sm"
- Main: 2-column grid (8 cols video, 4 cols tools)
- Padding: "md" throughout

**Responsive:**
- Navbar collapses on small screens
- Video player constrains to 60vh max height
- Annotations scroll independently

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
