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
- In-memory Map for annotations (lost on server restart)
- Videos served directly from filesystem

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
  frame: number        // frame number (timestamp * fps)
  tags: string[]       // array of tag strings
  notes: string        // freeform text notes
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
- `loading: boolean` - loading state
- `error: string | null` - error messages

**Methods:**
- `loadVideos()` - Fetch videos from API, auto-select first
- `selectVideo(video)` - Change selected video, load its annotations
- `loadAnnotations(videoId)` - Fetch annotations for video
- `addAnnotation(timestamp, frame, tags, notes)` - Create annotation
- `deleteAnnotation(annotationId)` - Remove annotation
- `updateAnnotation(annotationId, updates)` - Modify annotation
- `setCurrentTime(time, frame)` - Update playback position

### VideoList (src/VideoList.tsx)

**Purpose**: Display list of available videos, allow selection

**Props:**
- `appState: AppState` - global state reference

**UI:**
- Scrollable list of video cards
- Shows video index and filename
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
- `duration: number` - total video duration
- `playing: boolean` - play/pause state
- `fps: number` - frames per second (hardcoded 30)

**Computed:**
- `currentFrame` - Math.floor(currentTime * fps)
- `totalFrames` - Math.floor(duration * fps)

**UI Elements:**
- HTML5 `<video>` element
- Frame/time display
- Timeline slider (step = 1/fps)
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

**UI Sections:**

1. **Add Annotation Card**
   - Shows current frame/timestamp
   - Tag input + "Add" button (Enter key supported)
   - Tag badges with remove (×) button
   - Notes textarea
   - "Save Annotation" button (disabled if empty)

2. **All Annotations Card**
   - Scrollable list (300px height)
   - Shows annotation count
   - Each annotation shows:
     - Frame number
     - Delete button (×)
     - Tag badges
     - Notes text
   - Highlights annotations near current frame (±5 frames, blue background)

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

## Future Enhancements

- Persistent storage (SQLite via bun:sqlite)
- Export annotations to JSON/CSV
- Video upload support
- Annotation search/filter
- Keyboard shortcuts
- Custom FPS configuration
- Frame thumbnails
- Annotation timeline visualization
