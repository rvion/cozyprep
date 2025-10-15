  AppState (src/AppState.ts)
  - Global MobX state manager
  - Manages videos, selected video, annotations, current time/frame
  - Handles all API calls

  VideoList (src/VideoList.tsx)
  - Left sidebar showing all 15 videos
  - Click to select a video
  - Highlights currently selected video

  VideoPlayer (src/VideoPlayer.tsx)
  - Center panel with HTML5 video player
  - Frame-by-frame controls (prev/next frame)
  - Play/pause button
  - Slider for scrubbing through video
  - Shows current frame and timestamp
  - Assumes 30 FPS

  AnnotationTools (src/AnnotationTools.tsx)
  - Right panel with tagging interface
  - Add multiple tags to current frame
  - Add notes
  - Save annotations
  - View all annotations with delete option
  - Highlights annotations near current frame

  Layout

  - Mantine UI with AppShell
  - Left: Video list (300px sidebar)
  - Center: Video player (8 cols)
  - Right: Annotation tools (4 cols)