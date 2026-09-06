"use client";

import { createContext, useContext, useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from "react";

// Split into two contexts on purpose: `zoom`/`panX`/`panY` change on every
// single wheel tick while panning or zooming, and `isInteracting` only flips
// twice per gesture. Cards read `isInteracting` (to cover a video embed
// during the pan) but not `zoom`/`panX`/`panY` reactively - keeping them in
// one context would re-render every card on every tick of every pan/zoom,
// even ones with nothing that cares about the transform itself.
type CanvasTransformContextType = {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panX: number;
  setPanX: React.Dispatch<React.SetStateAction<number>>;
  panY: number;
  setPanY: React.Dispatch<React.SetStateAction<number>>;
  /** Latest zoom, for event handlers (drag/resize) that need it without subscribing to re-renders. */
  zoomRef: React.RefObject<number>;
};

type CanvasInteractionContextType = {
  isInteracting: boolean;
  setIsInteracting: React.Dispatch<React.SetStateAction<boolean>>;
};

const CanvasTransformContext = createContext<CanvasTransformContextType | null>(null);
const CanvasInteractionContext = createContext<CanvasInteractionContextType | null>(null);

export function CanvasProvider({ children, id }: { children: ReactNode; id?: string }) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    if (!id) return;
    const stored = sessionStorage.getItem(`loggo-canvas-${id}`);
    // Restoring per-day canvas state when `id` changes has to read
    // sessionStorage, an external system - a legitimate effect, even though
    // it looks like the "adjusting state in response to a prop" pattern
    // this rule otherwise catches.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (stored) {
      try {
        const { z, x, y } = JSON.parse(stored);
        if (typeof z === "number") setZoom(z);
        if (typeof x === "number") setPanX(x);
        if (typeof y === "number") setPanY(y);
        return;
      } catch { /* ignore */ }
    }
    // Reset if no saved state
    setZoom(1);
    setPanX(0);
    setPanY(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timeout = setTimeout(() => {
      sessionStorage.setItem(`loggo-canvas-${id}`, JSON.stringify({ z: zoom, x: panX, y: panY }));
    }, 100);
    return () => clearTimeout(timeout);
  }, [id, zoom, panX, panY]);

  const transformValue = useMemo<CanvasTransformContextType>(() => ({ zoom, setZoom, panX, setPanX, panY, setPanY, zoomRef }), [zoom, panX, panY]);
  const interactionValue = useMemo<CanvasInteractionContextType>(() => ({ isInteracting, setIsInteracting }), [isInteracting]);

  return (
    <CanvasTransformContext.Provider value={transformValue}>
      <CanvasInteractionContext.Provider value={interactionValue}>
        {children}
      </CanvasInteractionContext.Provider>
    </CanvasTransformContext.Provider>
  );
}

const zoomRefFallback: React.RefObject<number> = { current: 1 };

export function useCanvas() {
  const ctx = useContext(CanvasTransformContext);
  if (!ctx) return {
    zoom: 1,
    setZoom: (() => {}) as React.Dispatch<React.SetStateAction<number>>,
    panX: 0,
    setPanX: (() => {}) as React.Dispatch<React.SetStateAction<number>>,
    panY: 0,
    setPanY: (() => {}) as React.Dispatch<React.SetStateAction<number>>,
    zoomRef: zoomRefFallback,
  };
  return ctx;
}

// Separate from `useCanvas()` so reading `isInteracting` (e.g. to cover a
// video embed while the canvas moves) doesn't also subscribe to the
// pan/zoom transform, which changes far more often. See the comment above
// `CanvasTransformContextType`.
export function useCanvasInteraction() {
  const ctx = useContext(CanvasInteractionContext);
  if (!ctx) return { isInteracting: false, setIsInteracting: (() => {}) as React.Dispatch<React.SetStateAction<boolean>> };
  return ctx;
}

// Chrome briefly blanks a cross-origin iframe (e.g. a YouTube embed) while an
// ancestor's CSS transform is actively changing - the embed's own process
// can't keep its painted frame in sync with the canvas's pan/zoom transform.
// There's no CSS fix for this, so consumers hide the iframe behind a static
// placeholder while `isInteracting` is true and swap it back once the canvas
// settles.
const INTERACTION_IDLE_DELAY = 150;

function transformString(x: number, y: number, z: number) {
  return `translate(${x}px, ${y}px) scale(${z})`;
}

export function CanvasViewport({ children }: { children: ReactNode }) {
  const { zoom, setZoom, panX, setPanX, panY, setPanY } = useCanvas();
  const { setIsInteracting } = useCanvasInteraction();
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  // The authoritative live values during an active gesture. React state
  // (zoom/panX/panY) mirrors this for other consumers (the toolbar's zoom %,
  // session persistence) but isn't what drives the visible transform while
  // panning/zooming - waiting on a React render per wheel/pointer event was
  // the actual source of the stutter, since the browser can fire many of
  // those per second (trackpad pinch especially). Writing straight to the
  // DOM here means every event paints immediately, with React catching up
  // asynchronously alongside it rather than gating it.
  const stateRef = useRef({ zoom, panX, panY });
  const interactionIdleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);
  // getBoundingClientRect() forces a synchronous layout flush - cache it
  // instead of calling it on every single zoom tick.
  const containerRectRef = useRef<DOMRect | null>(null);

  const applyTransform = useCallback((x: number, y: number, z: number) => {
    if (transformRef.current) transformRef.current.style.transform = transformString(x, y, z);
  }, []);

  // Keep the DOM transform (and the ref other handlers read) in sync
  // whenever React state changes from outside this component's own
  // handlers - e.g. the toolbar's zoom buttons, reset-to-100%, or restoring
  // a saved canvas position on mount.
  useEffect(() => {
    if (isInteractingRef.current) return;
    stateRef.current = { zoom, panX, panY };
    applyTransform(panX, panY, zoom);
  }, [zoom, panX, panY, applyTransform]);

  // Wheel pan/zoom has no discrete "end" event, so mark interacting on every
  // event and debounce clearing it until the events stop arriving.
  const markInteracting = useCallback(() => {
    setIsInteracting(true);
    isInteractingRef.current = true;
    if (transformRef.current) transformRef.current.style.willChange = "transform";
    if (interactionIdleTimeout.current) clearTimeout(interactionIdleTimeout.current);
    interactionIdleTimeout.current = setTimeout(() => {
      setIsInteracting(false);
      isInteractingRef.current = false;
      if (transformRef.current) transformRef.current.style.willChange = "auto";
    }, INTERACTION_IDLE_DELAY);
  }, [setIsInteracting]);

  useEffect(() => () => { if (interactionIdleTimeout.current) clearTimeout(interactionIdleTimeout.current); }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => { containerRectRef.current = container.getBoundingClientRect(); };
    measure();
    window.addEventListener("resize", measure);

    const handleWheel = (e: WheelEvent) => {
      // Zooming (ctrlKey is true for trackpad pinch or ctrl+wheel)
      if (e.ctrlKey) {
        // Re-measure only at the start of a gesture (not on every tick, to
        // avoid forcing a layout flush mid-zoom) - also self-heals from a
        // layout change (e.g. the sidebar toggling) between gestures.
        if (!interactionIdleTimeout.current) measure();
        markInteracting();
        e.preventDefault(); // Always prevent native browser zoom!

        const { zoom, panX, panY } = stateRef.current;

        // Calculate new zoom
        const zoomFactor = Math.pow(0.99, e.deltaY);
        let newZoom = zoom * zoomFactor;
        newZoom = Math.max(0.1, Math.min(newZoom, 5)); // limit zoom between 10% and 500%

        // Zoom towards mouse cursor
        const rect = containerRectRef.current ?? container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // The cursor's position in the canvas space
        const canvasX = (mouseX - panX) / zoom;
        const canvasY = (mouseY - panY) / zoom;

        const newPanX = mouseX - canvasX * newZoom;
        const newPanY = mouseY - canvasY * newZoom;

        stateRef.current = { zoom: newZoom, panX: newPanX, panY: newPanY };
        applyTransform(newPanX, newPanY, newZoom);
        setZoom(newZoom);
        setPanX(newPanX);
        setPanY(newPanY);
        return;
      }

      // If we are panning, check if we're hovering a scrollable element
      if (e.target instanceof Element) {
        const scrollable = e.target.closest('.overflow-y-auto, .overflow-auto, .overflow-x-auto, [data-slot="scroll-area-viewport"], .cm-scroller');
        if (scrollable) {
          // A two-finger trackpad pan is rarely perfectly axis-aligned, so a
          // mostly-vertical pan can carry a little incidental deltaX. That's
          // fine for most scrollable elements (deltaX only matters once
          // deltaY loses the `>` comparison below), but the attachment strip
          // only ever scrolls horizontally - so for it specifically, require
          // deltaX to clearly dominate before treating the gesture as "scroll
          // the strip" rather than "pan the canvas", or a vertical pan over a
          // card's attachments would keep getting eaten sideways. A
          // deliberate horizontal swipe (or shift+wheel) still clears this
          // easily and reaches attachments further along the strip.
          const isAttachmentStrip = scrollable.matches('[data-slot="attachment-group"]');
          const isScrollingY = isAttachmentStrip
            ? Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.5
            : Math.abs(e.deltaY) > Math.abs(e.deltaX);
          let canScroll = false;

          if (isScrollingY) {
            const isScrollableY = scrollable.scrollHeight > Math.ceil(scrollable.clientHeight);
            if (isScrollableY) {
              if (e.deltaY < 0 && scrollable.scrollTop > 0) canScroll = true;
              if (e.deltaY > 0 && Math.ceil(scrollable.scrollTop + scrollable.clientHeight) < scrollable.scrollHeight) canScroll = true;
            }
          } else {
            const isScrollableX = scrollable.scrollWidth > Math.ceil(scrollable.clientWidth);
            if (isScrollableX) {
              if (e.deltaX < 0 && scrollable.scrollLeft > 0) canScroll = true;
              if (e.deltaX > 0 && Math.ceil(scrollable.scrollLeft + scrollable.clientWidth) < scrollable.scrollWidth) canScroll = true;
            }
          }

          if (canScroll) {
            // Let the browser scroll the element natively, don't pan the canvas
            return;
          }
        }
      }

      // Panning the canvas
      markInteracting();
      e.preventDefault(); // Prevents overscroll bounce
      const { zoom, panX, panY } = stateRef.current;
      const newPanX = panX - e.deltaX;
      const newPanY = panY - e.deltaY;
      stateRef.current = { zoom, panX: newPanX, panY: newPanY };
      applyTransform(newPanX, newPanY, zoom);
      setPanX(newPanX);
      setPanY(newPanY);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", measure);
    };
  }, [setZoom, setPanX, setPanY, markInteracting, applyTransform]);

  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click pan (button 1) or if we wanted spacebar pan we could add it
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      isPanning.current = true;
      setIsInteracting(true);
      isInteractingRef.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    const { zoom, panX, panY } = stateRef.current;
    const newPanX = panX + dx;
    const newPanY = panY + dy;
    stateRef.current = { zoom, panX: newPanX, panY: newPanY };
    applyTransform(newPanX, newPanY, zoom);
    setPanX(newPanX);
    setPanY(newPanY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      setIsInteracting(false);
      isInteractingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden outline-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => { if (e.shiftKey) e.preventDefault(); }}
    >
      <div ref={transformRef} style={{ transform: transformString(panX, panY, zoom), transformOrigin: "0 0" }} className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
