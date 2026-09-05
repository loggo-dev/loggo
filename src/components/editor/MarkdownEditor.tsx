"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, placeholder as placeholderExtension } from "@codemirror/view";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { defaultEditorCommands, filterEditorCommands, type EditorCommand } from "./commands/editorCommands";
import { baseSetup } from "./extensions/baseSetup";
import { linkClickExtension } from "./extensions/links";
import { liveMarkdown } from "./extensions/liveMarkdown";
import { insertLink, markdownEditorKeymap, toggleWrap } from "./extensions/markdownKeymap";
import { selectionRangeListener, type SelectionRange } from "./extensions/selectionToolbar";
import { slashCommandKeymap, slashRangeField, slashRangeListener, type SlashMenuBridge, type SlashRange } from "./extensions/slashCommands";
import { markdownEditorTheme } from "./extensions/theme";
import { codeHighlighting, languages } from "./highlighting";
import { SelectionToolbar } from "./SelectionToolbar";
import { SlashCommandMenu } from "./SlashCommandMenu";

export type MarkdownEditorHandle = {
  view: () => EditorView | null;
  focus: () => void;
  insertAtCursor: (text: string, caretOffset?: number) => void;
};

export type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  /** Appended to the default slash-command registry - keeps it easy to add app-specific commands later. */
  commands?: EditorCommand[];
  /** Extra CodeMirror extensions for host-specific behavior (e.g. tag completion, paste handling). Memoize this. */
  extensions?: Extension[];
  className?: string;
};

type SlashMenuState = { range: SlashRange; query: string; anchor: { left: number; top: number; bottom: number } } | null;

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(function MarkdownEditor(
  { value, onChange, placeholder, readOnly = false, commands, extensions, className },
  ref,
) {
  const parent = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const commandList = useMemo(() => (commands?.length ? [...defaultEditorCommands, ...commands] : defaultEditorCommands), [commands]);

  const [slash, setSlash] = useState<SlashMenuState>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const filtered = useMemo(() => filterEditorCommands(commandList, slash?.query ?? ""), [commandList, slash?.query]);
  useEffect(() => setHighlightedIndex(0), [slash?.query]);

  type SelectionToolbarState = { range: SelectionRange; anchor: { left: number; top: number } } | null;
  const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarState>(null);

  // Mirrors React state into a ref so the CodeMirror-side bridge (created
  // once) always sees the latest filtered list / selection without needing
  // to reconfigure the editor on every keystroke.
  const liveRef = useRef({ filtered, highlightedIndex, slash, selectionToolbar });
  useEffect(() => {
    liveRef.current = { filtered, highlightedIndex, slash, selectionToolbar };
  });

  // `slashRangeField` is derived purely from doc + selection, so pressing
  // Escape (which only clears the React-side `slash` state) leaves it
  // pointing at the exact same range - the next keystroke that doesn't move
  // the caret out of that range would otherwise reopen the menu right back
  // up. Remembering the dismissed range's start suppresses that until the
  // caret actually leaves the slash context (the range field going null).
  const dismissedFromRef = useRef<number | null>(null);

  const bridge = useMemo<SlashMenuBridge>(
    () => ({
      isOpen: () => liveRef.current.slash != null,
      moveSelection: (delta) => {
        const count = liveRef.current.filtered.length;
        if (!count) return;
        setHighlightedIndex((index) => (index + delta + count) % count);
      },
      confirmSelection: () => {
        const { filtered: options, highlightedIndex: index, slash: current } = liveRef.current;
        const instance = view.current;
        if (!current || !instance || !options.length) return false;
        options[Math.min(index, options.length - 1)].execute(instance, current.range);
        setSlash(null);
        return true;
      },
      close: () => {
        dismissedFromRef.current = liveRef.current.slash?.range.from ?? null;
        setSlash(null);
      },
    }),
    [],
  );

  const updateSlashFromRange = useMemo(
    () => (range: SlashRange | null) => {
      if (!range) {
        dismissedFromRef.current = null;
        setSlash(null);
        return;
      }
      if (dismissedFromRef.current === range.from) return;
      const instance = view.current;
      if (!instance) {
        setSlash(null);
        return;
      }
      const coords = instance.coordsAtPos(range.from);
      if (!coords) {
        setSlash(null);
        return;
      }
      setSlash({ range, query: instance.state.sliceDoc(range.from + 1, range.to), anchor: { left: coords.left, top: coords.top, bottom: coords.bottom } });
    },
    [],
  );

  const recomputeSlashPosition = useMemo(
    () => () => {
      const current = liveRef.current.slash;
      const instance = view.current;
      if (!current || !instance) return;
      const coords = instance.coordsAtPos(current.range.from);
      if (!coords) return;
      setSlash((previous) => (previous ? { ...previous, anchor: { left: coords.left, top: coords.top, bottom: coords.bottom } } : previous));
    },
    [],
  );

  const TOOLBAR_HEIGHT = 44;

  const selectionAnchorFor = (instance: EditorView, range: SelectionRange) => {
    const fromCoords = instance.coordsAtPos(range.from);
    const toCoords = instance.coordsAtPos(range.to, -1);
    if (!fromCoords) return null;
    const sameLine = toCoords != null && Math.abs(toCoords.top - fromCoords.top) < 1;
    const left = sameLine && toCoords ? (fromCoords.left + toCoords.right) / 2 : fromCoords.left;
    return { left, top: fromCoords.top - TOOLBAR_HEIGHT };
  };

  const updateSelectionFromRange = useMemo(
    () => (range: SelectionRange | null) => {
      const instance = view.current;
      if (!range || !instance) {
        setSelectionToolbar(null);
        return;
      }
      const anchor = selectionAnchorFor(instance, range);
      setSelectionToolbar(anchor ? { range, anchor } : null);
    },
    [],
  );

  const recomputeSelectionToolbarPosition = useMemo(
    () => () => {
      const current = liveRef.current.selectionToolbar;
      const instance = view.current;
      if (!current || !instance) return;
      const anchor = selectionAnchorFor(instance, current.range);
      setSelectionToolbar((previous) => (previous && anchor ? { ...previous, anchor } : previous));
    },
    [],
  );

  const applyToSelection = (run: (view: EditorView) => void) => {
    const instance = view.current;
    if (!instance) return;
    run(instance);
    instance.focus();
  };

  useImperativeHandle(
    ref,
    () => ({
      view: () => view.current,
      focus: () => view.current?.focus(),
      insertAtCursor: (text, caretOffset) => {
        const instance = view.current;
        if (!instance) return;
        const from = instance.state.selection.main.from;
        instance.dispatch({ changes: { from, insert: text }, selection: { anchor: from + (caretOffset ?? text.length) } });
        instance.focus();
      },
    }),
    [],
  );

  useEffect(() => {
    if (!parent.current) return;
    const instance = new EditorView({
      parent: parent.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          baseSetup,
          markdown({ base: markdownLanguage, codeLanguages: languages, addKeymap: true }),
          codeHighlighting,
          liveMarkdown,
          linkClickExtension,
          markdownEditorKeymap,
          slashRangeField,
          slashRangeListener(updateSlashFromRange),
          slashCommandKeymap(bridge),
          selectionRangeListener(updateSelectionFromRange),
          EditorView.lineWrapping,
          markdownEditorTheme,
          EditorView.editable.of(!readOnly),
          EditorState.readOnly.of(readOnly),
          placeholder ? placeholderExtension(placeholder) : [],
          extensions ?? [],
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = instance;
    // The editor only draws a visible caret once it actually has DOM focus
    // (CodeMirror hides `.cm-cursor` otherwise) - without this, a card that
    // just switched into edit mode shows no caret until clicked a second time.
    if (!readOnly) instance.focus();

    const handleScroll = () => {
      recomputeSlashPosition();
      recomputeSelectionToolbarPosition();
    };
    instance.scrollDOM.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      instance.scrollDOM.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      instance.destroy();
      view.current = null;
      setSlash(null);
      setSelectionToolbar(null);
    };
    // `value` is synced by the effect below; recreate only when config that
    // can't be cheaply reconfigured changes (mirrors log-editor.tsx's editor).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, placeholder, extensions]);

  useEffect(() => {
    const instance = view.current;
    if (!instance || instance.state.doc.toString() === value) return;
    instance.dispatch({ changes: { from: 0, to: instance.state.doc.length, insert: value } });
  }, [value]);

  return (
    <>
      {/* No border/background/min-height by default - the editor should sit
          flush inside whatever container it's placed in (e.g. a card that
          already provides its own padding), not read as a separate box. */}
      <div ref={parent} className={className} />
      <SlashCommandMenu
        commands={filtered}
        highlightedIndex={highlightedIndex}
        anchor={slash?.anchor ?? null}
        onHighlight={setHighlightedIndex}
        onSelect={(command) => {
          const instance = view.current;
          if (!instance || !slash) return;
          command.execute(instance, slash.range);
          setSlash(null);
        }}
      />
      <SelectionToolbar
        anchor={selectionToolbar?.anchor ?? null}
        onBold={() => applyToSelection(toggleWrap("**"))}
        onItalic={() => applyToSelection(toggleWrap("_"))}
        onCode={() => applyToSelection(toggleWrap("`"))}
        onLink={() => applyToSelection(insertLink)}
      />
    </>
  );
});
