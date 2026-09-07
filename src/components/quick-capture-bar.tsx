"use client";

import { MaximizeIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { LogEditor } from "@/components/log-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function QuickCaptureBar({ expanded, onExpandedChange, tags, saving, onQuickCreate, onSave, onCancel, onPasteFile }: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  tags: string[];
  saving: boolean;
  onQuickCreate: (body: string) => void;
  onSave: (values: { title: string | null; body: string }) => void;
  onCancel: () => void;
  onPasteFile: (file: File, values: { title: string | null; body: string }) => Promise<string>;
}) {
  const [quick, setQuick] = useState("");

  if (expanded) {
    return <Card><CardContent><LogEditor tags={tags} saving={saving} onSave={onSave} onSubmit={onSave} onCancel={() => { onExpandedChange(false); onCancel(); }} onPasteFile={onPasteFile} showTitle={false} /></CardContent></Card>;
  }

  const submit = () => {
    if (!quick.trim()) return;
    onQuickCreate(quick);
    setQuick("");
  };

  return <div className="flex items-center gap-1 rounded-xl border bg-card p-2">
    <Input
      value={quick}
      onChange={(event) => setQuick(event.target.value)}
      onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }}
      placeholder="Drop a thought, task, or note... (⌘L)"
      className="border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
    />
    <Button type="button" size="icon" variant="ghost" onClick={() => onExpandedChange(true)} aria-label="Open full editor"><MaximizeIcon /></Button>
    <Button type="button" size="icon" onClick={submit} disabled={!quick.trim()} aria-label="Add Log"><SendIcon /></Button>
  </div>;
}
