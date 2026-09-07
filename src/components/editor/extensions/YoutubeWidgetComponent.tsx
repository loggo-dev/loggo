import * as React from "react";
import { useCanvasInteraction } from "@/components/canvas-provider";

export function YoutubeWidgetComponent({ videoId, title }: { videoId: string; title: string }) {
  const { isInteracting } = useCanvasInteraction();

  return (
    <div className="w-full max-w-lg aspect-video my-4 rounded-lg overflow-hidden border bg-muted relative group" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {isInteracting ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            YouTube Video
          </span>
        </div>
      ) : (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
}
