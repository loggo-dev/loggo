import { syntaxTree } from "@codemirror/language";
import { EditorState, MapMode, Prec, StateField } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

export type SlashRange = { from: number; to: number };

const SLASH_WORD_PATTERN = /^\/[\p{L}\p{N}_-]*/u;
const SLASH_AT_CURSOR_PATTERN = /^\s*(\/[\p{L}\p{N}_-]*)$/u;
const CODE_CONTEXT_NODES = new Set(["FencedCode", "CodeBlock", "InlineCode", "CodeText", "CodeMark", "CodeInfo"]);

function isInsideCode(state: EditorState, pos: number): boolean {
  for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(pos, -1); node; node = node.parent) {
    if (CODE_CONTEXT_NODES.has(node.name)) return true;
  }
  return false;
}

// Is `from` still a live slash trigger - "/" at the start of its line
// (only whitespace before it), not inside code? Purely a function of the
// text at that fixed position, independent of where the caret currently is,
// so an already-open menu stays open while the caret moves elsewhere.
function slashMatchAt(state: EditorState, from: number): SlashRange | null {
  const line = state.doc.lineAt(from);
  if (from < line.from || from > line.to) return null;
  if (!/^\s*$/.test(state.doc.sliceString(line.from, from))) return null;
  if (state.doc.sliceString(from, from + 1) !== "/") return null;
  if (isInsideCode(state, from)) return null;
  const match = SLASH_WORD_PATTERN.exec(state.doc.sliceString(from, line.to));
  return match ? { from, to: from + match[0].length } : null;
}

// A slash command is only offered when "/" (plus what's typed after it) is
// the entire content of the line so far - this mirrors Notion/Logseq's
// trigger and keeps "/" usable as normal text everywhere else (mid-sentence,
// inside a fenced block, etc). Used only to detect a *new* trigger at the
// caret; once one is found, `slashMatchAt` keeps it alive independent of
// caret movement (see slashRangeField below).
function detectNewSlash(state: EditorState): SlashRange | null {
  const selection = state.selection.main;
  if (!selection.empty) return null;
  const line = state.doc.lineAt(selection.from);
  const match = SLASH_AT_CURSOR_PATTERN.exec(state.doc.sliceString(line.from, selection.from));
  if (!match) return null;
  // `match` locates the caret-relative "/word"; hand its start (the "/"
  // itself) to slashMatchAt so both detection and later revalidation agree
  // on what "from" means.
  const from = line.from + match[0].length - match[1].length;
  return slashMatchAt(state, from);
}

export const slashRangeField = StateField.define<SlashRange | null>({
  create: detectNewSlash,
  update(value, tr) {
    if (!tr.docChanged && !tr.selection) return value;
    if (value) {
      const mapped = tr.changes.mapPos(value.from, -1, MapMode.TrackDel);
      const stillValid = mapped == null ? null : slashMatchAt(tr.state, mapped);
      if (stillValid) {
        // A different "/" freshly started under the caret takes over from a
        // stale anchor (e.g. after dismissing it and starting a new one
        // elsewhere) - otherwise the existing anchor keeps winning even
        // though the caret has moved away, which is the point.
        const fresh = detectNewSlash(tr.state);
        return fresh && fresh.from !== stillValid.from ? fresh : stillValid;
      }
    }
    return detectNewSlash(tr.state);
  },
});

// The menu's filtered list, highlighted index, and selection logic live in
// React state (see MarkdownEditor); this bridge lets a high-priority keymap
// forward Arrow/Enter/Escape into that state without CodeMirror knowing
// anything about the menu. `bridge` is a stable object whose methods close
// over a ref the React component keeps current every render.
export type SlashMenuBridge = {
  isOpen: () => boolean;
  moveSelection: (delta: number) => void;
  confirmSelection: () => boolean;
  close: () => void;
};

export function slashCommandKeymap(bridge: SlashMenuBridge) {
  return Prec.highest(
    keymap.of([
      { key: "ArrowDown", run: () => bridge.isOpen() && (bridge.moveSelection(1), true) },
      { key: "ArrowUp", run: () => bridge.isOpen() && (bridge.moveSelection(-1), true) },
      { key: "Enter", run: () => bridge.isOpen() && bridge.confirmSelection() },
      { key: "Tab", run: () => bridge.isOpen() && bridge.confirmSelection() },
      { key: "Escape", run: () => bridge.isOpen() && (bridge.close(), true) },
    ]),
  );
}

export function slashRangeListener(onChange: (range: SlashRange | null) => void) {
  return EditorView.updateListener.of((update) => {
    if (!update.docChanged && !update.selectionSet && !update.viewportChanged) return;
    onChange(update.state.field(slashRangeField));
  });
}
