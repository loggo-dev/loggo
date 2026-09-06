"use client";

import type { EditorView } from "@codemirror/view";
import { BoldIcon, CalendarIcon, ClockIcon, Code2Icon, Heading1Icon, Heading2Icon, Heading3Icon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon, ListTodoIcon, MinusIcon, QuoteIcon, StrikethroughIcon, TableIcon, TerminalIcon } from "lucide-react";
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
  { id: "bold", label: "Bold", keywords: ["strong"], icon: <BoldIcon className="size-4" />, execute: (view, range) => insertText(view, range, "****", 2) },
  { id: "italic", label: "Italic", keywords: ["em"], icon: <ItalicIcon className="size-4" />, execute: (view, range) => insertText(view, range, "**", 1) },
  { id: "strikethrough", label: "Strikethrough", keywords: ["strike", "cross"], icon: <StrikethroughIcon className="size-4" />, execute: (view, range) => insertText(view, range, "~~~~", 2) },
  { id: "inline-code", label: "Inline Code", keywords: ["code", "mono"], icon: <TerminalIcon className="size-4" />, execute: (view, range) => insertText(view, range, "``", 1) },
  { id: "link", label: "Link", keywords: ["url", "href"], icon: <LinkIcon className="size-4" />, execute: (view, range) => insertText(view, range, "[]()", 1) },
  { id: "table", label: "Table", keywords: ["grid", "matrix"], icon: <TableIcon className="size-4" />, execute: (view, range) => insertText(view, range, "| Column 1 | Column 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n", 2) },
  { id: "time", label: "Current Time", keywords: ["now", "clock"], icon: <ClockIcon className="size-4" />, execute: (view, range) => {
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    insertText(view, range, timeString);
  }},
  { id: "date", label: "Today's Date", keywords: ["today", "now", "calendar"], icon: <CalendarIcon className="size-4" />, execute: (view, range) => {
    const dateString = new Date().toLocaleDateString('en-CA');
    insertText(view, range, dateString);
  }},
];

export function filterEditorCommands(commands: EditorCommand[], query: string): EditorCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((command) => [command.label, ...(command.keywords ?? [])].join(" ").toLowerCase().includes(q));
}
