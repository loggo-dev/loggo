import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { WidgetType, EditorView } from "@codemirror/view";
import { TableWidgetComponent, type TableData } from "./TableWidgetComponent";

export class TableWidget extends WidgetType {
  private root: Root | null = null;
  private readonly dataStr: string;

  constructor(
    readonly data: TableData
  ) {
    super();
    // Cache serialized data to make `eq` fast and robust
    this.dataStr = JSON.stringify(data);
  }

  eq(other: TableWidget) {
    return other.dataStr === this.dataStr;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("span");
    container.className = "cm-md-table-widget block";
    
    // Mount the React component
    this.root = createRoot(container);
    this.root.render(<TableWidgetComponent data={this.data} />);
    return container;
  }

  destroy(dom: HTMLElement) {
    if (this.root) {
      const root = this.root;
      setTimeout(() => root.unmount(), 0);
    }
  }

  ignoreEvent(event: Event) {
    // Ignore all events except those we explicitly want CodeMirror to handle.
    // This allows selecting text inside the table without moving the CodeMirror cursor,
    // though the table is rendered with userSelect="none" right now so they just click it to edit.
    return true; 
  }
}

import { StateField } from "@codemirror/state";
import { Decoration, type DecorationSet } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

export const tableDecorationsField = StateField.define<DecorationSet>({
  create(state) {
    return buildTableDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildTableDecorations(tr.state);
    }
    return decorations;
  },
  provide: f => EditorView.decorations.from(f)
});

function buildTableDecorations(state: import("@codemirror/state").EditorState) {
  const entries: { from: number; to: number; deco: Decoration }[] = [];
  
  syntaxTree(state).iterate({
    enter(ref) {
      if (ref.name === "Table") {
        const overlaps = state.selection.ranges.some(r => r.from <= ref.to && r.to >= ref.from);
        if (!overlaps && !state.readOnly) {
          // In read-only mode, we always replace it? Wait! In read-only mode, we should ALSO replace it.
          // Wait, state.readOnly is true in read-only mode. If we check !state.readOnly, it won't replace in read-only mode!
          // We want to replace it ALWAYS, EXCEPT when selection overlaps AND we are not in read-only mode.
        }
        
        const shouldReplace = state.readOnly || !overlaps;
        if (shouldReplace) {
          const node = ref.node;
          const header = node.getChild("TableHeader");
          const delim = node.getChild("TableDelimiter");
          
          const aligns: ("left" | "center" | "right" | null)[] = [];
          if (delim) {
            const delimText = state.sliceDoc(delim.from, delim.to);
            const pipes = delimText.split('|').map(s => s.trim()).filter(s => s.length > 0 && s.includes('-'));
            pipes.forEach(s => {
              if (s.startsWith(':') && s.endsWith(':')) aligns.push("center");
              else if (s.endsWith(':')) aligns.push("right");
              else if (s.startsWith(':')) aligns.push("left");
              else aligns.push(null);
            });
          }

          const headerCells: { text: string; align?: "left" | "center" | "right" | null }[] = [];
          if (header) {
            header.getChildren("TableCell").forEach((cell, i) => {
              headerCells.push({ text: state.sliceDoc(cell.from, cell.to), align: aligns[i] || null });
            });
          }

          const rows: { text: string; align?: "left" | "center" | "right" | null }[][] = [];
          const children = node.getChildren("TableRow");
          children.forEach(row => {
            const rowCells: { text: string; align?: "left" | "center" | "right" | null }[] = [];
            row.getChildren("TableCell").forEach((cell, i) => {
              rowCells.push({ text: state.sliceDoc(cell.from, cell.to), align: aligns[i] || null });
            });
            if (rowCells.length > 0) rows.push(rowCells);
          });

          entries.push({
            from: ref.from,
            to: ref.to,
            deco: Decoration.replace({
              widget: new TableWidget({ header: headerCells, rows }),
              block: true
            })
          });
          return false; // Skip children
        }
      }
    }
  });

  entries.sort((a, b) => a.from - b.from);
  return Decoration.set(entries.map(e => e.deco.range(e.from, e.to)), true);
}
