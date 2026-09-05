"use client";

import { LanguageDescription } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { codeHighlighting, languages } from "@/components/editor/highlighting";
import { Button } from "@/components/ui/button";

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

export function CodeBlock({ code, language, highlighted = true, clampHeight }: { code: string; language?: string; highlighted?: boolean; clampHeight?: boolean }) {
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
  return <div className="group relative rounded-lg border bg-muted/40 p-3">
    <div className="mb-1 flex items-center justify-between gap-2">
      <span className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">{language || "text"}</span>
      <Button size="icon" variant="ghost" className="size-6 opacity-0 transition-opacity group-hover:opacity-100" onClick={(event) => { event.stopPropagation(); void copy(); }} aria-label="Copy code">
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      </Button>
    </div>
    {highlighted
      ? <div ref={parent} className={clampHeight ? "max-h-64 overflow-hidden" : "overflow-x-auto"} />
      : <pre className={`overflow-x-auto whitespace-pre-wrap break-words font-mono text-[0.85rem] leading-6 ${clampHeight ? "max-h-64 overflow-hidden" : ""}`}><code>{code}</code></pre>}
  </div>;
}
