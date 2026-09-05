import { indentLess, indentMore } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { EditorSelection } from "@codemirror/state";
import { type Command, type EditorView, keymap } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

// Enter/Backspace list & blockquote continuation already comes from
// @codemirror/lang-markdown's own `markdownKeymap` (passed via `addKeymap`).
// This file only adds the bindings that package doesn't cover.

function inListContext(view: EditorView): boolean {
  const pos = view.state.selection.main.head;
  for (let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(pos, -1); node; node = node.parent) {
    if (node.name === "ListItem" || node.name === "Task") return true;
  }
  return false;
}

const indentListItem: Command = (view) => (inListContext(view) ? indentMore(view) : false);
const outdentListItem: Command = (view) => (inListContext(view) ? indentLess(view) : false);

// Exported so the selection toolbar's Bold/Italic/Code buttons run the exact
// same logic as the keyboard shortcuts below, instead of duplicating it.
export function toggleWrap(mark: string): Command {
  return (view) => {
    const range = view.state.selection.main;
    const before = view.state.sliceDoc(Math.max(0, range.from - mark.length), range.from);
    const after = view.state.sliceDoc(range.to, range.to + mark.length);
    if (before === mark && after === mark) {
      view.dispatch({
        changes: [
          { from: range.from - mark.length, to: range.from, insert: "" },
          { from: range.to, to: range.to + mark.length, insert: "" },
        ],
        selection: EditorSelection.range(range.from - mark.length, range.to - mark.length),
      });
      return true;
    }
    view.dispatch({
      changes: [
        { from: range.from, insert: mark },
        { from: range.to, insert: mark },
      ],
      selection: EditorSelection.range(range.from + mark.length, range.to + mark.length),
    });
    return true;
  };
}

export const insertLink: Command = (view) => {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to) || "text";
  const insert = `[${text}](url)`;
  const urlStart = range.from + text.length + 3;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert },
    selection: EditorSelection.range(urlStart, urlStart + "url".length),
  });
  return true;
};

export const markdownEditorKeymap = keymap.of([
  { key: "Tab", run: indentListItem },
  { key: "Shift-Tab", run: outdentListItem },
  { key: "Mod-b", run: toggleWrap("**") },
  { key: "Mod-i", run: toggleWrap("_") },
  { key: "Mod-k", run: insertLink },
]);
