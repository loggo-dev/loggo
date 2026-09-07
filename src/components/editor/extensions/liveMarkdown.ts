import { syntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { taskCheckboxDecoration } from "./checkboxes";
import { AttachmentWidget } from "./attachmentWidget";
import { CodeBlockWidget } from "./codeBlockWidget";
import { YoutubeWidget } from "./youtubeWidget";
import { resolveDueDate } from "@/server/domain/parse-markdown";


// Regex-per-line is what the previous implementation used; this rebuilds the
// same live-preview effect on top of the Lezer syntax tree instead, so
// nesting (`**_bold italic_**`), fenced-code language info, and GFM tasks are
// read from real parser nodes rather than re-derived with ad-hoc patterns.

function selectionOverlaps(view: EditorView, from: number, to: number) {
  if (view.state.readOnly || !view.hasFocus) return false;
  return view.state.selection.ranges.some((range) => range.from <= to && range.to >= from);
}

// Extends a "hide this marker" range past any trailing spaces (e.g. the
// space after "#" or ">") so removing the marker doesn't leave a stray gap.
function hideThroughSpace(state: EditorState, from: number, to: number, limit: number) {
  let end = to;
  while (end < limit && state.sliceDoc(end, end + 1) === " ") end++;
  return end;
}

const hide = Decoration.replace({});
const strongMark = Decoration.mark({ class: "cm-md-strong" });
const emphasisMark = Decoration.mark({ class: "cm-md-em" });
const inlineCodeMark = Decoration.mark({ class: "cm-md-code" });
const linkTextMark = Decoration.mark({ class: "cm-md-link" });
const listMarkerMark = Decoration.mark({ class: "cm-md-list-marker" });
const taskMarkerRawMark = Decoration.mark({ class: "cm-md-task-marker-raw" });
const blockquoteLine = Decoration.line({ class: "cm-md-blockquote" });
const codeBlockLine = Decoration.line({ class: "cm-md-codeblock" });
const hrLine = Decoration.line({ class: "cm-md-hr" });
const headingLine = (level: number) => Decoration.line({ class: `cm-md-heading cm-md-h${level}` });

// Obsidian/Notion-style hint on the current, otherwise-empty line - only
// while focused, since it's meant to read as "you can type here", not as
// static placeholder text on every blank line in the document.
class SlashHintWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-md-slash-hint";
    span.textContent = "Type '/' for commands";
    span.setAttribute("aria-hidden", "true");
    return span;
  }
  eq() {
    return true;
  }
  ignoreEvent() {
    return true;
  }
}
const slashHint = Decoration.widget({ widget: new SlashHintWidget(), side: 1 });

const HEADING_LEVEL: Record<string, number> = {
  ATXHeading1: 1,
  ATXHeading2: 2,
  ATXHeading3: 3,
  ATXHeading4: 4,
  ATXHeading5: 5,
  ATXHeading6: 6,
};

function build(view: EditorView, workspaceId?: string, day?: string): DecorationSet {
  const state = view.state;
  const entries: { from: number; to: number; deco: Decoration }[] = [];
  const atLine = (pos: number, deco: Decoration) => entries.push({ from: pos, to: pos, deco });
  const span = (from: number, to: number, deco: Decoration) => {
    if (from < to) entries.push({ from, to, deco });
  };

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(ref) {
        const level = HEADING_LEVEL[ref.name];
        if (level) {
          const node = ref.node;
          const line = state.doc.lineAt(node.from);
          atLine(line.from, headingLine(level));
          const mark = node.getChild("HeaderMark");
          if (mark && !selectionOverlaps(view, line.from, line.to)) {
            span(mark.from, hideThroughSpace(state, mark.from, mark.to, node.to), hide);
          }
          return;
        }

        switch (ref.name) {
          case "StrongEmphasis":
          case "Emphasis": {
            const node = ref.node;
            const marks = node.getChildren("EmphasisMark");
            const open = marks[0];
            const close = marks[marks.length - 1];
            if (!open || !close || open === close) break;
            span(open.to, close.from, ref.name === "StrongEmphasis" ? strongMark : emphasisMark);
            if (!selectionOverlaps(view, node.from, node.to)) {
              span(open.from, open.to, hide);
              span(close.from, close.to, hide);
            }
            break;
          }
          case "InlineCode": {
            const node = ref.node;
            const marks = node.getChildren("CodeMark");
            const [open, close] = marks;
            if (!open || !close) break;
            span(open.to, close.from, inlineCodeMark);
            if (!selectionOverlaps(view, node.from, node.to)) {
              span(open.from, open.to, hide);
              span(close.from, close.to, hide);
            }
            break;
          }

          case "URL": {
            if (ref.node.parent?.name === "Link" || ref.node.parent?.name === "Image") break;
            const url = state.sliceDoc(ref.from, ref.to);
            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            if (ytMatch && !selectionOverlaps(view, ref.from, ref.to)) {
              span(ref.from, ref.to, Decoration.replace({
                widget: new YoutubeWidget(ytMatch[1], "YouTube Video")
              }));
              return false; // Skip children
            } else {
              span(ref.from, ref.to, linkTextMark);
            }
            break;
          }
          case "Image":
          case "Link": {
            const node = ref.node;
            const urlNode = node.getChild("URL");
            const url = urlNode ? state.sliceDoc(urlNode.from, urlNode.to) : "";
            
            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            if (ytMatch && !selectionOverlaps(view, node.from, node.to)) {
              span(node.from, node.to, Decoration.replace({
                widget: new YoutubeWidget(ytMatch[1], "YouTube Video")
              }));
              return false; // Skip children
            }

            const marks = node.getChildren("LinkMark");
            const openBracket = marks[0];
            const closeBracket = marks[1];
            if (!openBracket || !closeBracket) break;

            const isAttachment = url.includes("./_files/");

            if (isAttachment) {
              // Replace the whole markdown link with an attachment widget card
              const title = state.sliceDoc(openBracket.to, closeBracket.from) || "Attachment";
              const isImage = ref.name === "Image";
              
              const filename = url.slice("./_files/".length);
              const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';

              span(node.from, node.to, Decoration.replace({
                widget: new AttachmentWidget(title, ext, isImage, url, node.from, node.to, workspaceId)
              }));
              return false; // Skip children
            } else {
              span(openBracket.to, closeBracket.from, linkTextMark);
              if (!selectionOverlaps(view, node.from, node.to)) {
                if (ref.name === "Image") {
                  const imgMark = node.getChild("ImageMark");
                  if (imgMark) span(imgMark.from, openBracket.to, hide);
                } else {
                  span(openBracket.from, openBracket.to, hide);
                }
                span(closeBracket.from, node.to, hide);
              }
            }
            break;
          }
          case "Blockquote": {
            const node = ref.node;
            const fromLine = state.doc.lineAt(node.from).number;
            const toLine = state.doc.lineAt(node.to).number;
            for (let n = fromLine; n <= toLine; n++) atLine(state.doc.line(n).from, blockquoteLine);
            break;
          }
          case "QuoteMark": {
            const line = state.doc.lineAt(ref.from);
            if (!selectionOverlaps(view, line.from, line.to)) {
              span(ref.from, hideThroughSpace(state, ref.from, ref.to, line.to), hide);
            }
            break;
          }
          case "FencedCode": {
            const node = ref.node;
            const fromLine = state.doc.lineAt(node.from).number;
            const toLine = state.doc.lineAt(node.to).number;
            for (let n = fromLine; n <= toLine; n++) atLine(state.doc.line(n).from, codeBlockLine);

            const marks = node.getChildren("CodeMark");
            const info = node.getChild("CodeInfo");
            const openMark = marks[0];
            const closeMark = marks.length > 1 ? marks[marks.length - 1] : null;
            
            let codeText = "";
            if (openMark) {
              const openLine = state.doc.lineAt(openMark.from);
              const codeStart = openLine.to + 1;
              const codeEnd = closeMark ? closeMark.from - 1 : node.to;
              if (codeEnd > codeStart) {
                codeText = state.doc.sliceString(codeStart, codeEnd);
              }
            }

            if (openMark) {
              const openLine = state.doc.lineAt(openMark.from);
              if (!selectionOverlaps(view, openLine.from, openLine.to)) {
                const lang = info ? state.sliceDoc(info.from, info.to) : "";
                span(openMark.from, info ? info.to : openMark.to, Decoration.replace({
                  widget: new CodeBlockWidget(lang, codeText)
                }));
              }
            }
            if (closeMark) {
              const closeLine = state.doc.lineAt(closeMark.from);
              if (!selectionOverlaps(view, closeLine.from, closeLine.to)) span(closeMark.from, closeMark.to, hide);
            }
            break;
          }
          case "HorizontalRule": {
            const line = state.doc.lineAt(ref.from);
            atLine(line.from, hrLine);
            if (!selectionOverlaps(view, line.from, line.to)) span(ref.from, ref.to, hide);
            break;
          }
          case "ListMark": {
            const parent = ref.node.parent;
            if (parent?.name === "ListItem" && parent.getChild("Task")) {
              const line = state.doc.lineAt(ref.from);
              if (!selectionOverlaps(view, line.from, line.to)) {
                span(ref.from, hideThroughSpace(state, ref.from, ref.to, line.to), hide);
                break;
              }
            }
            span(ref.from, ref.to, listMarkerMark);
            break;
          }
          case "TaskMarker": {
            const line = state.doc.lineAt(ref.from);
            
            const checked = state.sliceDoc(ref.from + 1, ref.from + 2).toLowerCase() === "x";
            const lineText = line.text;
            const taskTextStart = ref.to - line.from;
            const taskText = lineText.slice(taskTextStart);
            const dueMatch = taskText.match(/(?:^|\s)(!)([\p{L}\d-]+)\s*$/u);
            if (dueMatch) {
              const bangIndex = taskTextStart + dueMatch.index! + dueMatch[0].lastIndexOf("!");
              const bangGlobalFrom = line.from + bangIndex;
              const textGlobalFrom = bangGlobalFrom + 1;
              const matchGlobalTo = textGlobalFrom + dueMatch[2].length;
              
              let classes = "cm-md-due-date";
              if (checked) {
                classes += " cm-md-due-date-done";
              } else if (day) {
                const resolved = resolveDueDate(dueMatch[2], day);
                if (resolved && new Date(`${resolved}T00:00:00`) < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00')) {
                  classes += " cm-md-due-date-overdue";
                }
              }
              
              span(textGlobalFrom, matchGlobalTo, Decoration.mark({ class: classes }));
              if (!selectionOverlaps(view, bangGlobalFrom, matchGlobalTo)) {
                span(bangGlobalFrom, textGlobalFrom, hide);
              }
            }

            // Keep the raw "[ ]"/"[x]" editable while the cursor is on this
            // line; render the interactive checkbox everywhere else. The raw
            // text otherwise falls through to Lezer's default "atom" style,
            // a light-mode-only blue that's unreadable in dark mode.
            if (selectionOverlaps(view, line.from, line.to)) {
              span(ref.from, ref.to, taskMarkerRawMark);
              break;
            }
            span(ref.from, ref.to, taskCheckboxDecoration(ref.from, checked));
            if (checked) {
              span(ref.to, line.to, Decoration.mark({ class: "cm-md-task-checked" }));
            }
            break;
          }
        }
      },
    });
  }

  if (view.hasFocus) {
    const cursor = state.selection.main;
    if (cursor.empty && state.doc.lineAt(cursor.from).length === 0) atLine(cursor.from, slashHint);
  }

  entries.sort((a, b) => a.from - b.from || a.to - b.to);
  return Decoration.set(
    entries.map((entry) => entry.deco.range(entry.from, entry.to)),
    true,
  );
}

export const createLiveMarkdown = (workspaceId?: string, day?: string) => ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = build(view, workspaceId, day);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) this.decorations = build(update.view, workspaceId, day);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
