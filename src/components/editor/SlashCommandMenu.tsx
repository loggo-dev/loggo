"use client";

import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { EditorCommand } from "./commands/editorCommands";

const MENU_WIDTH = 220;
const MENU_MARGIN = 8;
const MENU_MAX_HEIGHT = 288;
const MENU_GAP = 4;

export function SlashCommandMenu({
  commands,
  highlightedIndex,
  anchor,
  onHighlight,
  onSelect,
}: {
  commands: EditorCommand[];
  highlightedIndex: number;
  anchor: { left: number; top: number; bottom: number } | null;
  onHighlight: (index: number) => void;
  onSelect: (command: EditorCommand) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // `anchor` only ever becomes non-null after the CodeMirror view has mounted
  // and computed caret coordinates (a client-only effect), so this is never
  // reached during SSR - no separate "is mounted" gate needed before touching
  // `document`.
  if (!anchor) return null;

  const left = Math.min(anchor.left, window.innerWidth - MENU_WIDTH - MENU_MARGIN);
  const estimatedHeight = Math.min(MENU_MAX_HEIGHT, commands.length * 34 + MENU_MARGIN);
  const spaceAbove = anchor.top - MENU_MARGIN;
  const spaceBelow = window.innerHeight - anchor.bottom - MENU_MARGIN;
  const openAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
  const top = openAbove ? anchor.top - MENU_GAP : anchor.bottom + MENU_GAP;
  const availableHeight = Math.max(0, openAbove ? spaceAbove - MENU_GAP : spaceBelow - MENU_GAP);

  return createPortal(
    <div
      role="listbox"
      aria-label="Markdown commands"
      // Marks this portaled menu so a host's document-level "click outside
      // closes X" handler (it's rendered outside the editor's own DOM
      // subtree) can recognize a click here as still inside the editor.
      data-markdown-editor-popover=""
      style={{
        position: "fixed",
        left: Math.max(MENU_MARGIN, left),
        top,
        width: MENU_WIDTH,
        maxHeight: Math.min(MENU_MAX_HEIGHT, availableHeight),
        transform: openAbove ? "translateY(-100%)" : undefined,
      }}
      className="z-50 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
    >
      <div ref={listRef}>
        {commands.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">No matching commands</div>
        ) : (
          commands.map((command, index) => (
            <div
              key={command.id}
              data-index={index}
              role="option"
              aria-selected={index === highlightedIndex}
              id={`slash-command-${command.id}`}
              className={cn(
                "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none",
                index === highlightedIndex ? "bg-accent text-accent-foreground" : undefined,
              )}
              onMouseEnter={() => onHighlight(index)}
              onMouseDown={(event) => {
                // Keep focus (and the CodeMirror selection) inside the editor.
                event.preventDefault();
                onSelect(command);
              }}
            >
              {command.icon ? <span className="text-muted-foreground [&>svg]:size-4">{command.icon}</span> : null}
              <span>{command.label}</span>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}
