"use client";

import { LanguageDescription } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { CheckIcon, CopyIcon, MaximizeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { codeHighlighting, languages } from "@/components/editor/highlighting";
import { useCanvasInteraction } from "@/components/canvas-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const languageCompartment = new Compartment();

function readOnlyView(parent: HTMLDivElement, code: string) {
  return new EditorView({
    parent,
    state: EditorState.create({
      doc: code,
      extensions: [
        languageCompartment.of([]),
        codeHighlighting,
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { background: "transparent" },
          ".cm-scroller": { fontFamily: "var(--font-geist-mono)", lineHeight: "1.6", fontSize: "0.85rem" },
          ".cm-content": { padding: "0" },
          ".cm-gutters": { display: "none" },
        }),
      ],
    }),
  });
}

export function CodeBlock({ code, language, highlighted = true, clampHeight, showExpand = true }: { code: string; language?: string; highlighted?: boolean; clampHeight?: boolean; showExpand?: boolean }) {
  const parent = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!highlighted || !parent.current) return;
    const instance = readOnlyView(parent.current, code);
    const description = language ? LanguageDescription.matchLanguageName(languages, language, true) : null;
    if (description) void description.load().then((support) => instance.dispatch({ effects: languageCompartment.reconfigure(support) }));
    return () => instance.destroy();
  }, [code, language, highlighted]);
  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  // A live CodeMirror instance (one per highlighted snippet) is real DOM/paint
  // weight - with several on a day board at once, repainting all of them
  // while the canvas is being scaled is what makes panning/zooming feel
  // jerky. Rather than tear the editor down (losing its mounted state) while
  // interacting, just stop painting it (`invisible`, so it keeps its layout
  // box - no reflow) and show a plain unhighlighted placeholder in its place.
  const { isInteracting } = useCanvasInteraction();
  const showPlaceholder = highlighted && isInteracting;
  return <div className="group relative rounded-lg border bg-muted/40 p-3">
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">{language || "text"}</span>
      <div className="flex items-center gap-1">
        {showExpand ? (
          <Dialog>
            <DialogTrigger render={
              <Button size="icon" variant="ghost" className="size-6 opacity-0 transition-opacity group-hover:opacity-100" aria-label="Expand code" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                <MaximizeIcon className="size-3.5" />
              </Button>
            } />
            <DialogContent className="sm:max-w-4xl flex flex-col max-h-[85vh]">
              <DialogTitle className="sr-only">{language || "Code"} snippet</DialogTitle>
              <div className="flex-1 overflow-auto pt-6">
                <CodeBlock code={code} language={language} highlighted clampHeight={false} showExpand={false} />
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
        <Button size="icon" variant="ghost" className="size-6 opacity-0 transition-opacity group-hover:opacity-100" onClick={(event) => { event.stopPropagation(); void copy(); }} aria-label="Copy code">
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </Button>
      </div>
    </div>
    <div className="relative">
      {highlighted
        ? <div ref={parent} className={cn(clampHeight ? "max-h-64 overflow-auto" : "overflow-x-auto", showPlaceholder && "invisible")} />
        : <pre className={`overflow-x-auto whitespace-pre-wrap break-words font-mono text-[0.85rem] leading-6 ${clampHeight ? "max-h-64 overflow-auto" : ""}`}><code>{code}</code></pre>}
      {showPlaceholder ? (
        <pre className={`absolute inset-0 overflow-hidden whitespace-pre-wrap break-words font-mono text-[0.85rem] leading-6 text-muted-foreground ${clampHeight ? "max-h-64" : ""}`}>{code}</pre>
      ) : null}
    </div>
  </div>;
}
