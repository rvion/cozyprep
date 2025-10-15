import { serve } from "bun";
import index from "./index.html";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const VIDEOS_DIR = join(import.meta.dir, "../genshin_cosplay_bullet_time_rotate_shot");

/** In-memory annotation storage */
const annotations = new Map<string, Array<{
  id: string;
  videoId: string;
  timestamp: number;
  frame: number;
  tags: string[];
  notes: string;
}>>();

const server = serve({
  routes: {
    "/api/videos": {
      async GET() {
        try {
          const files = await readdir(VIDEOS_DIR);
          const videos = files
            .filter(f => f.endsWith(".mp4"))
            .map((name, idx) => ({
              id: name.replace(".mp4", ""),
              name,
              url: `/videos/${name}`,
              index: idx + 1,
            }));
          return Response.json(videos);
        } catch (err) {
          return Response.json({ error: "Failed to list videos" }, { status: 500 });
        }
      },
    },

    "/api/annotations/:videoId": {
      async GET(req) {
        const videoId = req.params.videoId;
        const data = annotations.get(videoId) || [];
        return Response.json(data);
      },
      async POST(req) {
        const videoId = req.params.videoId;
        const body = await req.json();
        const id = crypto.randomUUID();
        const annotation = { id, videoId, ...body };

        const current = annotations.get(videoId) || [];
        current.push(annotation);
        annotations.set(videoId, current);

        return Response.json(annotation);
      },
    },

    "/api/annotations/:videoId/:annotationId": {
      async DELETE(req) {
        const { videoId, annotationId } = req.params;
        const current = annotations.get(videoId) || [];
        const filtered = current.filter(a => a.id !== annotationId);
        annotations.set(videoId, filtered);
        return Response.json({ success: true });
      },
      async PUT(req) {
        const { videoId, annotationId } = req.params;
        const body = await req.json();
        const current = annotations.get(videoId) || [];
        const idx = current.findIndex(a => a.id === annotationId);
        if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });
        current[idx] = { ...current[idx], ...body };
        annotations.set(videoId, current);
        return Response.json(current[idx]);
      },
    },

    "/videos/:filename": async req => {
      const filename = req.params.filename;
      const file = Bun.file(join(VIDEOS_DIR, filename));
      const exists = await file.exists();
      if (!exists) return new Response("Not found", { status: 404 });
      return new Response(file);
    },

    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
