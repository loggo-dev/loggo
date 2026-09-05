"use client";

import { BoldIcon, CodeIcon, ItalicIcon, LinkIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const TOOLBAR_WIDTH = 148;
const TOOLBAR_MARGIN = 8;

function ToolbarButton({ label, onSelect, children }: { label: string; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // mousedown (not click) + preventDefault so the text selection this
      // toolbar is acting on survives the click instead of collapsing first.
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect();
      }}
      className="flex size-7 items-center justify-center rounded-md text-popover-foreground hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </button>
  );
}

export function SelectionToolbar({
  anchor,
  onBold,
  onItalic,
  onCode,
  onLink,
}: {
  anchor: { left: number; top: number } | null;
  onBold: () => void;
  onItalic: () => void;
  onCode: () => void;
  onLink: () => void;
}) {
  if (!anchor) return null;

  const left = Math.min(Math.max(TOOLBAR_MARGIN, anchor.left - TOOLBAR_WIDTH / 2), window.innerWidth - TOOLBAR_WIDTH - TOOLBAR_MARGIN);

  return createPortal(
    <div
      data-markdown-editor-popover=""
      style={{ position: "fixed", left, top: anchor.top, width: TOOLBAR_WIDTH }}
      className={cn("z-50 flex items-center justify-center gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10")}
    >
      <ToolbarButton label="Bold" onSelect={onBold}><BoldIcon className="size-4" /></ToolbarButton>
      <ToolbarButton label="Italic" onSelect={onItalic}><ItalicIcon className="size-4" /></ToolbarButton>
      <ToolbarButton label="Code" onSelect={onCode}><CodeIcon className="size-4" /></ToolbarButton>
      <ToolbarButton label="Link" onSelect={onLink}><LinkIcon className="size-4" /></ToolbarButton>
    </div>,
    document.body,
  );
}
