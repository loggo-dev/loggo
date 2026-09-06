import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import type { EditorView, KeyBinding } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

function getTableNode(state: EditorState, pos: number): SyntaxNode | null {
  const node = syntaxTree(state).resolveInner(pos, -1);
  for (let n: SyntaxNode | null = node; n; n = n.parent) {
    if (n.name === "Table") return n;
  }
  return null;
}

function getCells(table: SyntaxNode) {
  const cells: { from: number; to: number }[] = [];
  table.cursor().iterate((node) => {
    if (node.name === "TableCell") {
      cells.push({ from: node.from, to: node.to });
    }
  });
  return cells;
}

function getColumnCount(table: SyntaxNode): number {
  let cols = 0;
  const header = table.getChild("TableHeader");
  if (header) {
    header.cursor().iterate((node) => {
      if (node.name === "TableCell") cols++;
    });
  }
  return cols;
}

function navigateTable(view: EditorView, dir: 1 | -1): boolean {
  const state = view.state;
  const pos = state.selection.main.head;
  const table = getTableNode(state, pos);
  if (!table) return false;

  const cells = getCells(table);
  if (cells.length === 0) return false;

  // Find the cell we are currently in or closest to
  let currentIndex = cells.findIndex((c) => pos >= c.from && pos <= c.to);

  if (currentIndex === -1) {
    // If we're inside the table but not exactly in a cell (e.g., on a pipe)
    // find the first cell that starts after our position
    currentIndex = cells.findIndex((c) => c.from >= pos);
    if (currentIndex === -1) currentIndex = cells.length - 1; // Default to last cell if at the very end
  } else {
    currentIndex += dir;
  }

  // Wrap around or insert new row at the end
  if (currentIndex >= cells.length) {
    if (dir === 1) {
      return handleTableEnter(view);
    }
    return false;
  }
  if (currentIndex < 0) {
    return false; // Escaping the table backwards could be handled, but leaving as default is fine
  }

  selectCell(view, cells[currentIndex]);
  return true;
}

function selectCell(view: EditorView, cell: { from: number; to: number }) {
  const state = view.state;
  const cellText = state.sliceDoc(cell.from, cell.to);
  const match = cellText.match(/^(\s*)(.*?)(\s*)$/);

  const startOffset = match ? match[1].length : 0;
  const endOffset = match ? match[3].length : 0;

  let selFrom = cell.from + startOffset;
  const selTo = cell.to - endOffset;
  if (selFrom > selTo) selFrom = selTo;

  view.dispatch({
    selection: { anchor: selFrom, head: selTo },
    scrollIntoView: true,
  });
}

function handleTableEnter(view: EditorView): boolean {
  const state = view.state;
  const pos = state.selection.main.head;
  const table = getTableNode(state, pos);
  if (!table) return false;

  const cols = getColumnCount(table);
  if (cols === 0) return false;

  // Find the current row to insert after it, or insert at the end of the table
  const node = syntaxTree(state).resolveInner(pos, -1);
  let currentRow: SyntaxNode | null = node;
  while (currentRow && currentRow.name !== "TableRow" && currentRow.name !== "TableHeader" && currentRow.name !== "TableDelimiter") {
    currentRow = currentRow.parent;
  }

  // If we can't find the row, just append to the table
  const insertPos = currentRow ? currentRow.to : table.to;

  let newRowStr = "\n|";
  for (let i = 0; i < cols; i++) {
    newRowStr += "   |";
  }

  view.dispatch({
    changes: { from: insertPos, insert: newRowStr },
    // Position the cursor inside the first new cell (which is at insertPos + 3)
    selection: { anchor: insertPos + 3 },
    scrollIntoView: true,
  });

  return true;
}

export const tableKeymap: KeyBinding[] = [
  {
    key: "Tab",
    preventDefault: true,
    run: (view) => navigateTable(view, 1),
  },
  {
    key: "Shift-Tab",
    preventDefault: true,
    run: (view) => navigateTable(view, -1),
  },
  {
    key: "Enter",
    preventDefault: true,
    run: (view) => handleTableEnter(view),
  },
];
