"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { useCanvas } from "@/components/canvas-provider";

const DRAG_THRESHOLD = 4;

/**
 * Free-position dragging for board cards: distinguishes a click (open the
 * card) from a drag (reposition it) by a small pointer-movement threshold,
 * so both gestures can share one element with no separate drag handle.
 */
export function useDragPosition({ x, y, onCommit, onClick }: { x: number; y: number; onCommit: (x: number, y: number) => void; onClick?: (event: MouseEvent) => void }) {
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const startMouse = useRef<{ x: number; y: number } | null>(null);
  const startCard = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const justDragged = useRef(false);
  const pendingCommit = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (pendingCommit.current && pendingCommit.current.x === x && pendingCommit.current.y === y) {
      pendingCommit.current = null;
      setTargetPos(null);
    }
  }, [x, y]);

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) event.preventDefault();
    startMouse.current = { x: event.clientX, y: event.clientY };
    startCard.current = { x, y };
    moved.current = false;
  };

  // Read via ref, not reactively - this hook runs in every draggable card on
  // the board, and subscribing to `zoom` directly would re-render all of
  // them on every tick of the canvas being panned or zoomed elsewhere.
  const { zoomRef } = useCanvas();

  const onPointerMove = (event: PointerEvent) => {
    if (!startMouse.current || !startCard.current) return;
    const zoom = zoomRef.current;
    const dx = (event.clientX - startMouse.current.x) / zoom;
    const dy = (event.clientY - startMouse.current.y) / zoom;
    if (!moved.current && Math.hypot(dx * zoom, dy * zoom) < DRAG_THRESHOLD) return;
    if (!moved.current) {
      moved.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.getSelection()?.removeAllRanges();
    }
    setTargetPos({ x: Math.round(startCard.current.x + dx), y: Math.round(startCard.current.y + dy) });
  };

  const endDrag = (event: PointerEvent) => {
    if (!startMouse.current) return;
    if (moved.current && targetPos) {
      pendingCommit.current = targetPos;
      onCommit(targetPos.x, targetPos.y);
      justDragged.current = true;
      setTimeout(() => { justDragged.current = false; }, 0);
    } else {
      setTargetPos(null);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    startMouse.current = null;
    startCard.current = null;
    moved.current = false;
  };

  const handleClick = (event: MouseEvent) => {
    if (justDragged.current) { event.preventDefault(); event.stopPropagation(); return; }
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) event.target.focus();
    onClick?.(event);
  };

  const isDraggingActive = targetPos !== null;
  const currentDx = targetPos ? targetPos.x - x : 0;
  const currentDy = targetPos ? targetPos.y - y : 0;

  const style: CSSProperties | undefined = targetPos ? { transform: `translate(${currentDx}px, ${currentDy}px)`, zIndex: 30, cursor: isDraggingActive ? "grabbing" : undefined, willChange: isDraggingActive ? "transform" : "auto" } : undefined;

  return { isDragging: targetPos !== null, style, handlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onClick: handleClick } };
}
