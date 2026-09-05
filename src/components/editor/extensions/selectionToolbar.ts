import { EditorView } from "@codemirror/view";

export type SelectionRange = { from: number; to: number };

// Tells the React-side selection toolbar (see MarkdownEditor) when there's a
// non-empty selection to show formatting actions for.
export function selectionRangeListener(onChange: (range: SelectionRange | null) => void) {
  return EditorView.updateListener.of((update) => {
    if (!update.selectionSet && !update.docChanged && !update.viewportChanged) return;
    const range = update.state.selection.main;
    onChange(range.empty ? null : { from: range.from, to: range.to });
  });
}
