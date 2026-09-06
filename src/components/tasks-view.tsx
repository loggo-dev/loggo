"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { api, type TaskSummary } from "@/lib/api-client";
import { PageTitle } from "@/components/page-title";
import { useWorkspace } from "@/components/workspace-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { TaskFilterMenu, type TaskStatus } from "@/components/task-filter-menu";
import { cn, humanizeDate } from "@/lib/utils";

function dueGroup(task: TaskSummary) { if (task.done) return "Completed"; if (!task.dueDate) return "No due date"; const today = new Date().toISOString().slice(0, 10); if (task.dueDate < today) return "Overdue"; if (task.dueDate === today) return "Today"; return task.dueDate; }

export function TasksView() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();

  const queryParams: Record<string, string | number> = { page, status };
  if (from) queryParams.from = from;
  if (to) queryParams.to = to;

  const tasks = useQuery({ queryKey: ["tasks", workspace.id, page, from, to, status], queryFn: () => api.tasks(workspace.id, queryParams) });
  const toggle = useMutation({ mutationFn: ({ id, done }: { id: string; done: boolean }) => api.toggleTask(workspace.id, id, done), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); }, onError: (error) => toast.error(error.message) });
  const groups = Object.groupBy(tasks.data?.tasks ?? [], dueGroup);

  return <main className="page-shell"><PageTitle title="Tasks" description="Everything with a checkbox." />
    <div className="mb-4">
      <TaskFilterMenu status={status} onStatusChange={(value) => { setStatus(value); setPage(1); }} from={from} to={to} onFromChange={(val) => { setFrom(val); setPage(1); }} onToChange={(val) => { setTo(val); setPage(1); }} />
    </div>
    {tasks.data?.tasks.length ? <div className="flex flex-col gap-4">{Object.entries(groups).map(([group, items]) => <Card key={group}><CardHeader><CardTitle>{group}</CardTitle><CardDescription>{items?.length} {items?.length === 1 ? "task" : "tasks"}</CardDescription></CardHeader><CardContent className="flex flex-col gap-1">{items?.map((task) => {
      const isOverdue = task.dueDate && !task.done && new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
      return <label key={task.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"><Checkbox checked={task.done} onCheckedChange={(checked) => toggle.mutate({ id: task.id, done: checked === true })} /><span className="flex min-w-0 flex-1 flex-col"><span className={task.done ? "text-muted-foreground line-through" : undefined}>{task.text}{task.dueDate ? <span className={cn("ml-2 inline-flex items-center justify-center rounded-full border px-1.5 text-[10px] h-4 font-semibold transition-colors", isOverdue ? "border-destructive/50 text-destructive bg-destructive/10" : task.done ? "border-transparent text-muted-foreground bg-muted" : "text-muted-foreground")}>{humanizeDate(task.dueDate)}</span> : null}</span><Link href={`/d/${task.day}`} className="text-xs text-muted-foreground hover:underline">{task.logTitle ?? task.day}</Link></span></label>;
    })}</CardContent></Card>)}</div> : <Empty className="border"><EmptyHeader><EmptyTitle>No tasks found</EmptyTitle><EmptyDescription>Try another date range, or add a <code>- [ ]</code> checkbox to any Log.</EmptyDescription></EmptyHeader></Empty>}
    {tasks.data ? <SimplePagination page={tasks.data.page} hasMore={tasks.data.hasMore} onPageChange={setPage} /> : null}
  </main>;
}
