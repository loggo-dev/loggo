import { syntaxTree } from "@codemirror/language";
import { EditorView } from "@codemirror/view";

function resolveLinkUrlAt(view: EditorView, pos: number): string | null {
  const node = syntaxTree(view.state).resolveInner(pos, 1);
  for (let n: typeof node | null = node; n; n = n.parent) {
    if (n.name === "Link") {
      const url = n.getChild("URL");
      return url ? view.state.sliceDoc(url.from, url.to) : null;
    }
  }
  return null;
}

// Cmd/Ctrl+click on a live-previewed link opens it, matching how most
// Markdown live-preview editors avoid hijacking a plain click (which should
// place the caret so the raw syntax can be edited).
export const linkClickExtension = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (!(event.metaKey || event.ctrlKey)) return false;
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos == null) return false;
    const url = resolveLinkUrlAt(view, pos);
    if (!url) return false;
    event.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  },
});
