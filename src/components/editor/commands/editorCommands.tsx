"use client";

import type { EditorView } from "@codemirror/view";
import { Code2Icon, Heading1Icon, Heading2Icon, Heading3Icon, ListIcon, ListOrderedIcon, ListTodoIcon, MinusIcon, QuoteIcon } from "lucide-react";
import type { ReactNode } from "react";

export type CommandRange = { from: number; to: number };

export type EditorCommand = {
  id: string;
  label: string;
  keywords?: string[];
  icon?: ReactNode;
  execute: (view: EditorView, range: CommandRange) => void;
};

function insertText(view: EditorView, range: CommandRange, text: string, cursorOffset = text.length) {
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: text },
    selection: { anchor: range.from + cursorOffset },
  });
  view.focus();
}

// The registry the slash-command menu renders from. Add app-specific commands
// by concatenating another array onto this one (see MarkdownEditor's
// `commands` prop) rather than editing the menu component.
export const defaultEditorCommands: EditorCommand[] = [
  { id: "task", label: "Task", keywords: ["todo", "checkbox"], icon: <ListTodoIcon className="size-4" />, execute: (view, range) => insertText(view, range, "- [ ] ") },
  { id: "heading-1", label: "Heading 1", keywords: ["h1", "title"], icon: <Heading1Icon className="size-4" />, execute: (view, range) => insertText(view, range, "# ") },
  { id: "heading-2", label: "Heading 2", keywords: ["h2", "subtitle"], icon: <Heading2Icon className="size-4" />, execute: (view, range) => insertText(view, range, "## ") },
  { id: "heading-3", label: "Heading 3", keywords: ["h3"], icon: <Heading3Icon className="size-4" />, execute: (view, range) => insertText(view, range, "### ") },
  { id: "bullet-list", label: "Bullet List", keywords: ["ul", "unordered", "bullet"], icon: <ListIcon className="size-4" />, execute: (view, range) => insertText(view, range, "- ") },
  { id: "numbered-list", label: "Numbered List", keywords: ["ol", "ordered", "numbered"], icon: <ListOrderedIcon className="size-4" />, execute: (view, range) => insertText(view, range, "1. ") },
  { id: "quote", label: "Quote", keywords: ["blockquote"], icon: <QuoteIcon className="size-4" />, execute: (view, range) => insertText(view, range, "> ") },
  { id: "code-block", label: "Code Block", keywords: ["fence", "snippet", "```"], icon: <Code2Icon className="size-4" />, execute: (view, range) => insertText(view, range, "```\n\n```", 4) },
  { id: "divider", label: "Divider", keywords: ["hr", "rule", "separator", "---"], icon: <MinusIcon className="size-4" />, execute: (view, range) => insertText(view, range, "---\n") },
];

export function filterEditorCommands(commands: EditorCommand[], query: string): EditorCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((command) => [command.label, ...(command.keywords ?? [])].join(" ").toLowerCase().includes(q));
}
