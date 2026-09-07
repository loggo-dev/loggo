"use client";

import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown";
import { PaperclipIcon, LoaderCircleIcon, VideoIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { toast } from "sonner";
import type { EditorCommand } from "@/components/editor/commands/editorCommands";
import { MarkdownEditor, type MarkdownEditorHandle } from "@/components/editor/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AUTOSAVE_DELAY = 800;

export function LogEditor({ initialTitle = "", initialBody = "", tags = [], saving, onSave, onSubmit, onCancel, onPasteFile, autoSave = false, footerMessage, titleClassName = "text-base md:text-base font-heading font-medium leading-snug", showTitle = true }: { initialTitle?: string; initialBody?: string; tags?: string[]; saving?: boolean; onSave: (values: { title: string | null; body: string }) => void; onSubmit?: (values: { title: string | null; body: string }) => void; onCancel?: () => void; onPasteFile?: (file: File, values: { title: string | null; body: string }) => Promise<string>; autoSave?: boolean; footerMessage?: ReactNode; titleClassName?: string; showTitle?: boolean }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const editor = useRef<MarkdownEditorHandle>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const valuesRef = useRef({ title, body });
  useEffect(() => { valuesRef.current = { title, body }; }, [title, body]);

  const attachFile = useCallback(async (file: File) => {
    if (!onPasteFile) throw new Error("Attachments are not available yet");
    return onPasteFile(file, { title: valuesRef.current.title.trim() || null, body: valuesRef.current.body });
  }, [onPasteFile]);

  const requestAttachment = useCallback(() => fileInput.current?.click(), []);

  const handleAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    void attachFile(file).then((link) => editor.current?.insertAtCursor(`${isImage ? "!" : ""}[${file.name}](${link})`)).catch((error) => toast.error(error.message));
  };

  const hasPasteHandler = !!onPasteFile;

  // Extends the default slash-command registry with app-specific commands
  // ("Attachment", "YouTube") instead of the menu component knowing about
  // uploads or embeds.
  const commands = useMemo<EditorCommand[]>(() => {
    const list: EditorCommand[] = [{
      id: "youtube",
      label: "YouTube",
      keywords: ["video", "embed", "yt"],
      icon: <VideoIcon className="size-4" />,
      execute: (view, range) => {
        // Select the placeholder so the very next thing the user types or
        // pastes (typically a copied YouTube URL) replaces it outright.
        const placeholder = "youtube-url";
        view.dispatch({
          changes: { from: range.from, to: range.to, insert: placeholder },
          selection: { anchor: range.from, head: range.from + placeholder.length },
        });
        view.focus();
      },
    }];
    if (hasPasteHandler) {
      // execute only runs when the user picks this command from the slash
      // menu, never during render - same as the CodeMirror handlers below.
      // eslint-disable-next-line react-hooks/refs
      list.push({
        id: "attachment",
        label: "Attachment",
        keywords: ["image", "upload", "file", "pdf"],
        icon: <PaperclipIcon className="size-4" />,
        execute: (view, range) => {
          view.dispatch({ changes: { from: range.from, to: range.to, insert: "" } });
          requestAttachment();
        },
      });
    }
    return list;
  }, [hasPasteHandler, requestAttachment]);

  // attachFile is read through a ref (not a hook dependency) purely so a
  // paste doesn't force the whole CodeMirror instance to be recreated.
  const attachFileRef = useRef(attachFile);
  useEffect(() => { attachFileRef.current = attachFile; }, [attachFile]);

  const tagsRef = useRef(tags);
  useEffect(() => { tagsRef.current = tags; }, [tags]);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

  // Tag (#tag) completion and image-paste-to-attachment are specific to this
  // app, so they're passed in as extra CodeMirror extensions rather than
  // baked into the reusable MarkdownEditor.
  const extensions = useMemo<Extension[]>(() => {
    const completeTags = (context: CompletionContext) => {
      const word = context.matchBefore(/#[\p{L}\p{N}_/-]*/u);
      if (!word) return null;
      return { from: word.from + 1, options: tagsRef.current.map((tag) => ({ label: tag, type: "keyword" })) };
    };
    // The paste handler below only runs when the browser dispatches a real
    // paste event on the editor, never during render - the lint rule can't
    // see that through CodeMirror's `domEventHandlers` API.
    // eslint-disable-next-line react-hooks/refs
    const pasteHandler = EditorView.domEventHandlers({
      paste: (event, view) => {
        const file = event.clipboardData?.files?.[0];
        if (!file || !hasPasteHandler) return false;
        event.preventDefault();
        const isImage = file.type.startsWith("image/");
        void attachFileRef.current(file).then((link) => view.dispatch({ changes: { from: view.state.selection.main.from, insert: `${isImage ? "!" : ""}[${file.name}](${link})` } })).catch((error) => toast.error(error.message));
        return true;
      },
    });
    // eslint-disable-next-line react-hooks/refs
    const submitHandler = keymap.of([
      {
        key: "Enter",
        run: (view) => {
          if (onSubmitRef.current) {
            onSubmitRef.current({ title: valuesRef.current.title.trim() || null, body: view.state.doc.toString() });
            return true;
          }
          return false;
        },
      },
      {
        key: "Shift-Enter",
        run: insertNewlineContinueMarkup,
      }
    ]);
    // completeTags reads tagsRef only when CodeMirror invokes it after render.
    // eslint-disable-next-line react-hooks/refs
    return [autocompletion({ override: [completeTags], icons: false, maxRenderedOptions: 12 }), pasteHandler, submitHandler];
  }, [hasPasteHandler]);

  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);
  const lastSaved = useRef({ title: initialTitle, body: initialBody });
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoSave) return;
    if (title === lastSaved.current.title && body === lastSaved.current.body) return;
    pendingSave.current = setTimeout(() => {
      lastSaved.current = { title, body };
      pendingSave.current = null;
      onSaveRef.current({ title: title.trim() || null, body });
    }, AUTOSAVE_DELAY);
    return () => { if (pendingSave.current) clearTimeout(pendingSave.current); };
  }, [title, body, autoSave]);

  // Flush any not-yet-fired autosave (e.g. Escape right after typing) instead
  // of silently losing the last edit when the editor unmounts.
  useEffect(() => {
    if (!autoSave) return;
    return () => {
      if (pendingSave.current) {
        clearTimeout(pendingSave.current);
        const latest = valuesRef.current;
        onSaveRef.current({ title: latest.title.trim() || null, body: latest.body });
      }
    };
  }, [autoSave]);

  return <div className="flex flex-col gap-1 h-full">
    {showTitle ? <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title (optional)" className={`h-auto shrink-0 rounded-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 dark:bg-transparent ${titleClassName}`} /> : null}
    <input ref={fileInput} type="file" className="hidden" onChange={handleAttachment} />
    {/* No separate "edit mode" chrome and no Preview tab - the live-preview
        editor already looks like rendered Markdown, so entering edit mode
        should feel like the card itself became editable, not like a
        different UI opened on top of it. Keeps the outer card's
        drag-to-reposition from seeing pointerdown events that started
        inside the editor, so text selection/click-to-place-cursor keeps
        working when the card is draggable. */}
    <div className="flex-1 min-h-0 flex flex-col text-sm" onPointerDownCapture={(event) => event.stopPropagation()}>
      <MarkdownEditor ref={editor} value={body} onChange={setBody} commands={commands} extensions={extensions} className="flex-1 min-h-0 [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-y-auto" />
    </div>
    <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground shrink-0">
      <span>{footerMessage ?? <>Type / for commands{hasPasteHandler ? " · paste files" : ""}</>}</span>
      {autoSave ? null : <div className="flex gap-2">{onCancel ? <Button variant="ghost" onClick={onCancel}>Cancel</Button> : null}<Button onClick={() => onSave({ title: title.trim() || null, body })} disabled={saving || !body.trim()}>{saving ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : null}Save Log</Button></div>}
    </div>
  </div>;
}
