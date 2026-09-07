import { EditorView } from "@codemirror/view";

// All editor-specific visual styling lives here so MarkdownEditor stays a
// plain CodeMirror wire-up. Reuses the app's existing CSS custom properties
// (see src/app/globals.css) instead of introducing new colors/spacing.
export const markdownEditorTheme = EditorView.theme({
  "&": { background: "transparent", color: "var(--foreground)", outline: "none" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-geist-sans)", lineHeight: "1.5rem" },
  // No horizontal padding: the editor should align flush with whatever
  // container it's placed in (which supplies its own padding), the same way
  // the rendered Markdown preview does - not read as an inset box.
  // No `drawSelection()` extension (see baseSetup.ts), so this native
  // `caretColor` is what actually draws the caret - and it follows the
  // app's theme automatically via `--foreground`.
  ".cm-content": { padding: "0", caretColor: "var(--foreground)", outline: "none" },
  ".cm-line": { padding: "0" },
  ".cm-gutters": { display: "none" },
  ".cm-focused": { outline: "none" },
  ".cm-placeholder": { color: "var(--muted-foreground)" },
  ".cm-md-slash-hint": { color: "var(--muted-foreground)", pointerEvents: "none", userSelect: "none" },

  ".cm-md-heading": { fontWeight: "600" },
  ".cm-md-h1": { fontSize: "1.5rem" }, /* text-2xl */
  ".cm-md-h2": { fontSize: "1.25rem" }, /* text-xl */
  ".cm-md-h3": { fontSize: "1.125rem" }, /* text-lg */
  ".cm-md-h4": { fontSize: "1rem" },
  ".cm-md-h5": { fontSize: "0.875rem" },
  ".cm-md-h6": { fontSize: "0.875rem", color: "var(--muted-foreground)" },

  ".cm-md-strong": { fontWeight: "600" },
  ".cm-md-em": { fontStyle: "italic" },
  ".cm-md-code": {
    fontFamily: "var(--font-geist-mono)",
    fontSize: "0.9em",
    background: "var(--muted)",
    borderRadius: "var(--radius-sm)",
    padding: "0 4px",
  },
  ".cm-md-link, .cm-md-link *": { color: "var(--primary) !important", textDecoration: "underline", textUnderlineOffset: "3px", cursor: "text" },
  
  ".cm-md-attachment": {
    display: "inline-flex",
    alignItems: "center",
    background: "var(--muted)",
    padding: "0 8px",
    borderRadius: "var(--radius)",
    fontSize: "0.85em",
    fontWeight: "500",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
  },
  ".cm-md-attachment::before": {
    content: "'📎'",
    marginRight: "4px",
  },

  ".cm-md-blockquote": {
    borderLeft: "3px solid var(--border)",
    paddingLeft: "10px",
    marginLeft: "2px",
    color: "var(--muted-foreground)",
  },
  ".cm-md-codeblock": {
    fontFamily: "var(--font-geist-mono)",
    fontSize: "0.9em",
    background: "var(--muted)",
    paddingLeft: "8px",
    paddingRight: "8px",
  },
  ".cm-line:not(.cm-md-codeblock) + .cm-line.cm-md-codeblock, .cm-line.cm-md-codeblock:first-child": {
    borderTopLeftRadius: "var(--radius-sm)",
    borderTopRightRadius: "var(--radius-sm)",
    paddingTop: "4px",
  },
  ".cm-line.cm-md-codeblock:not(:has(+ .cm-line.cm-md-codeblock)), .cm-line.cm-md-codeblock:last-child": {
    borderBottomLeftRadius: "var(--radius-sm)",
    borderBottomRightRadius: "var(--radius-sm)",
    paddingBottom: "4px",
  },
  ".cm-md-list-marker": { color: "var(--muted-foreground)" },
  ".cm-md-hr": {
    color: "var(--muted-foreground) !important",
    borderBottom: "2px solid var(--border)",
    width: "100%",
    marginBottom: "0.5rem",
    marginTop: "0.5rem"
  },
  ".cm-md-hr *": { color: "var(--muted-foreground) !important" },
  // Overrides Lezer's default "atom" style for the raw "[ ]"/"[x]" text,
  // which is a light-mode-only blue that's unreadable in dark mode.
  ".cm-md-task-marker-raw, .cm-md-task-marker-raw *": { color: "var(--muted-foreground) !important" },

  ".cm-md-task-checkbox": { verticalAlign: "text-bottom", marginRight: "4px" },
  ".cm-md-task-checked": { color: "var(--muted-foreground)", textDecoration: "line-through" },

  ".cm-tooltip.cm-tooltip-autocomplete": {
    minWidth: "240px",
    overflow: "hidden",
    padding: "4px",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    boxShadow: "0 10px 30px color-mix(in oklab, var(--foreground) 12%, transparent)",
  },
  ".cm-tooltip-autocomplete > ul": { maxHeight: "min(320px, 40vh)", fontFamily: "var(--font-geist-sans)" },
  ".cm-tooltip-autocomplete > ul > li": { display: "flex", alignItems: "center", minHeight: "34px", padding: "6px 8px", borderRadius: "6px" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" },
  ".cm-completionLabel": { fontWeight: "500" },
  ".cm-completionMatchedText": { textDecoration: "none", color: "var(--primary)" },
  ".cm-completionDetail": {
    marginLeft: "auto",
    paddingLeft: "16px",
    color: "var(--muted-foreground)",
    fontFamily: "var(--font-geist-mono)",
    fontSize: "11px",
    fontStyle: "normal",
  },
});
