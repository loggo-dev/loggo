"use client";

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";

type CanvasContextType = {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  panX: number;
  setPanX: React.Dispatch<React.SetStateAction<number>>;
  panY: number;
  setPanY: React.Dispatch<React.SetStateAction<number>>;
};

const CanvasContext = createContext<CanvasContextType | null>(null);

export function CanvasProvider({ children, id }: { children: ReactNode; id?: string }) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  useEffect(() => {
    if (!id) return;
    const stored = sessionStorage.getItem(`loggo-canvas-${id}`);
    if (stored) {
      try {
        const { z, x, y } = JSON.parse(stored);
        if (typeof z === "number") setZoom(z);
        if (typeof x === "number") setPanX(x);
        if (typeof y === "number") setPanY(y);
        return;
      } catch (e) { /* ignore */ }
    }
    // Reset if no saved state
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timeout = setTimeout(() => {
      sessionStorage.setItem(`loggo-canvas-${id}`, JSON.stringify({ z: zoom, x: panX, y: panY }));
    }, 100);
    return () => clearTimeout(timeout);
  }, [id, zoom, panX, panY]);

  return (
    <CanvasContext.Provider value={{ zoom, setZoom, panX, setPanX, panY, setPanY }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) return { 
    zoom: 1, 
    setZoom: (() => {}) as React.Dispatch<React.SetStateAction<number>>, 
    panX: 0, 
    setPanX: (() => {}) as React.Dispatch<React.SetStateAction<number>>, 
    panY: 0, 
    setPanY: (() => {}) as React.Dispatch<React.SetStateAction<number>> 
  };
  return ctx;
}

export function CanvasViewport({ children }: { children: ReactNode }) {
  const { zoom, setZoom, panX, setPanX, panY, setPanY } = useCanvas();
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ zoom, panX, panY });
  
  // Keep refs up to date for the event listener
  useEffect(() => {
    stateRef.current = { zoom, panX, panY };
  }, [zoom, panX, panY]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      // Zooming (ctrlKey is true for trackpad pinch or ctrl+wheel)
      if (e.ctrlKey) {
        e.preventDefault(); // Always prevent native browser zoom!
        
        const { zoom, panX, panY } = stateRef.current;
        
        // Calculate new zoom
        const zoomFactor = Math.pow(0.99, e.deltaY);
        let newZoom = zoom * zoomFactor;
        newZoom = Math.max(0.1, Math.min(newZoom, 5)); // limit zoom between 10% and 500%
        
        // Zoom towards mouse cursor
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // The cursor's position in the canvas space
        const canvasX = (mouseX - panX) / zoom;
        const canvasY = (mouseY - panY) / zoom;
        
        setZoom(newZoom);
        setPanX(mouseX - canvasX * newZoom);
        setPanY(mouseY - canvasY * newZoom);
        return;
      }

      // If we are panning, check if we're hovering a scrollable element
      if (e.target instanceof Element) {
        const scrollable = e.target.closest('.overflow-y-auto, .overflow-auto, .overflow-x-auto, [data-slot="scroll-area-viewport"], .cm-scroller');
        if (scrollable) {
          const isScrollableY = scrollable.scrollHeight > Math.ceil(scrollable.clientHeight);
          const isScrollableX = scrollable.scrollWidth > Math.ceil(scrollable.clientWidth);
          const isScrollingY = Math.abs(e.deltaY) > Math.abs(e.deltaX);
          
          if ((isScrollableY && isScrollingY) || (isScrollableX && !isScrollingY)) {
            // Let the browser scroll the element natively, don't pan the canvas
            return;
          }
        }
      }

      // Panning the canvas
      e.preventDefault(); // Prevents overscroll bounce
      setPanX((prev) => prev - e.deltaX);
      setPanY((prev) => prev - e.deltaY);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [setZoom, setPanX, setPanY]);

  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click pan (button 1) or if we wanted spacebar pan we could add it
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
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
      <div style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: "0 0" }} className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}

