"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecksIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useDragPosition } from "@/hooks/use-drag-position";
import { useWorkspace } from "@/components/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

const DEFAULT_POSITION = { x: 420, y: 24 };

function positionKey(workspaceId: string, date: string) {
  return `loggo:tasks-card-pos:${workspaceId}:${date}`;
}

function loadPosition(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as { x: number; y: number };
  } catch {
    // localStorage can throw in private browsing; fall back to the default spot.
  }
  return DEFAULT_POSITION;
}

// The Today board's tasks widget looks and drags like a Log card, but it
// aggregates checkboxes from every Log on the day rather than being one
// itself, so its on-screen position is a per-viewer UI preference (kept in
// localStorage) rather than data worth persisting server-side.
export function TasksCard({ date, floating = true }: { date: string; floating?: boolean }) {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const key = positionKey(workspace.id, date);
  // The parent keys this component by `date`, so a day change remounts it —
  // reading localStorage lazily here is enough, no effect needed to resync.
  const [pos, setPos] = useState(() => loadPosition(key));
  const commit = (x: number, y: number) => {
    setPos({ x, y });
    try { localStorage.setItem(key, JSON.stringify({ x, y })); } catch { /* per-viewer convenience only */ }
  };
  const drag = useDragPosition({ x: pos.x, y: pos.y, onCommit: commit });

  const tasks = useQuery({ queryKey: ["tasks", workspace.id, "board", date], queryFn: () => api.tasks(workspace.id, { board: date }) });
  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => api.toggleTask(workspace.id, id, done),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); },
    onError: (error) => toast.error(error.message),
  });
  const items = tasks.data?.tasks ?? [];
  const open = items.filter((task) => !task.done);
  const done = items.filter((task) => task.done);

  const floatingProps = floating ? { style: { position: "absolute" as const, left: pos.x, top: pos.y, ...drag.style }, className: `w-72 cursor-grab touch-none select-none ${drag.isDragging ? "shadow-lg" : ""}`, ...drag.handlers } : { className: "w-full" };

  return <Card {...floatingProps}>
    <CardHeader>
      <CardTitle className="text-sm">Today&apos;s tasks</CardTitle>
      <CardAction><Badge variant="secondary">{open.length}</Badge></CardAction>
    </CardHeader>
    <CardContent className="flex flex-col gap-2 pt-0">
      {items.length === 0 ? <Empty className="border-none p-0">
        <EmptyHeader><EmptyMedia variant="icon"><ListChecksIcon /></EmptyMedia><EmptyTitle className="text-sm">No tasks yet</EmptyTitle><EmptyDescription>Add a <code>- [ ]</code> line to a Log.</EmptyDescription></EmptyHeader>
      </Empty> : <div className="flex flex-col gap-1">
        {[...open, ...done].map((task) => <label key={task.id} className="flex items-start gap-2 rounded-lg px-1.5 py-1.5 text-sm hover:bg-muted/50">
          <Checkbox checked={task.done} onCheckedChange={(checked) => toggle.mutate({ id: task.id, done: checked === true })} className="mt-0.5" />
          <span className={task.done ? "text-muted-foreground line-through" : undefined}>{task.text}</span>
        </label>)}
      </div>}
    </CardContent>
  </Card>;
}
