"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useCanvas } from "@/components/canvas-provider";

export function useResize({ width, height, onCommit }: { width: number | null | undefined; height: number | null | undefined; onCommit: (w: number, h: number) => void }) {
  const [targetSize, setTargetSize] = useState<{ w: number; h: number } | null>(null);
  const startMouse = useRef<{ x: number; y: number } | null>(null);
  const startSize = useRef<{ w: number; h: number } | null>(null);

  // Read via ref, not reactively - see the matching comment in use-drag-position.ts.
  const { zoomRef } = useCanvas();

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.stopPropagation(); // prevent drag
    event.preventDefault(); // prevent text selection
    startMouse.current = { x: event.clientX, y: event.clientY };
    const rect = (event.currentTarget as HTMLElement).closest(".group\\/card")?.getBoundingClientRect();
    // getBoundingClientRect() reports on-screen (zoom-scaled) pixels, but
    // width/height are canvas-space values the CSS `scale(zoom)` ancestor
    // then scales up for display - dividing back out by zoom here is what
    // makes this match `width`/`height` instead of snapping the card to its
    // zoomed-out (or zoomed-in) size the instant you grab the handle.
    const zoom = zoomRef.current;
    startSize.current = { w: (rect?.width ?? width ?? 320) / zoom, h: (rect?.height ?? height ?? 220) / zoom };
    setTargetSize(startSize.current);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!startMouse.current || !startSize.current) return;
    const zoom = zoomRef.current;
    const dx = (event.clientX - startMouse.current.x) / zoom;
    const dy = (event.clientY - startMouse.current.y) / zoom;
    setTargetSize({ w: Math.round(Math.max(200, startSize.current.w + dx)), h: Math.round(Math.max(100, startSize.current.h + dy)) });
  };

  if (targetSize && width === targetSize.w && height === targetSize.h) {
    setTargetSize(null);
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!startMouse.current) return;
    if (targetSize) onCommit(targetSize.w, targetSize.h);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    startMouse.current = null;
    startSize.current = null;
  };

  const currentW = targetSize?.w ?? width ?? undefined;
  const currentH = targetSize?.h ?? height ?? undefined;

  const style: CSSProperties | undefined = (currentW || currentH) ? { width: currentW ?? 320, height: currentH ?? 220 } : undefined;

  return { style, isResizing: targetSize != null, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}
