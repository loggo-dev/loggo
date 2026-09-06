"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { LogCard } from "@/components/log-card";
import { LogCardSkeleton, type LogCardSkeletonVariant } from "@/components/log-card-skeleton";
import { PageTitle } from "@/components/page-title";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { LogFilterMenu } from "@/components/log-filter-menu";

const LOG_CARD_HEIGHT = 280;

const loadingCards: { variant: LogCardSkeletonVariant; title?: boolean; badge?: boolean; lines?: number }[] = [
  { variant: "text", lines: 4 },
  { variant: "task", lines: 5, badge: true },
  { variant: "attachment" },
  { variant: "code" },
  { variant: "text", lines: 3, title: false },
  { variant: "task", lines: 4, badge: true },
];



export function LogsView({ initialTag }: { initialTag?: string }) {
  const [tag, setTag] = useState(initialTag ?? "all");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const tags = useQuery({ queryKey: ["tags", workspace.id], queryFn: () => api.tags(workspace.id) });
  
  const queryParams: { page: number; tag?: string; from?: string; to?: string } = { page };
  if (tag !== "all") queryParams.tag = tag;
  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  
  const logs = useQuery({ queryKey: ["logs", workspace.id, "all", tag, page, from, to], queryFn: () => api.logs(workspace.id, queryParams) });
  const tasks = useQuery({ queryKey: ["tasks", workspace.id], queryFn: () => api.tasks(workspace.id) });
  const tasksByLog = Object.groupBy(tasks.data?.tasks ?? [], (task) => task.logId);
  const toggleTask = useMutation({ mutationFn: ({ id, done }: { id: string; done: boolean }) => api.toggleTask(workspace.id, id, done), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); }, onError: (error) => toast.error(error.message) });
  const duplicateLog = useMutation({ mutationFn: (id: string) => api.duplicateLog(workspace.id, id), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); toast.success("Log duplicated"); }, onError: (error) => toast.error(error.message) });
  
  const handleTagChange = (value: string) => { setTag(value); setPage(1); };

  return <main className="page-shell"><PageTitle title={initialTag ? `#${initialTag}` : "Logs"} description={initialTag ? "Logs with this tag." : "Everything in this workspace, oldest first."} action={<Button onClick={() => router.push(`/d/${new Date().toISOString().slice(0, 10)}?new=1`)}><PlusIcon data-icon="inline-start" />New Log</Button>} />
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <LogFilterMenu
        tag={initialTag ? undefined : tag}
        onTagChange={initialTag ? undefined : handleTagChange}
        tags={tags.data?.tags}
        from={from}
        to={to}
        onFromChange={(val) => { setFrom(val); setPage(1); }}
        onToChange={(val) => { setTo(val); setPage(1); }}
      />
    </div>
    {logs.isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1 auto-rows-min items-start">{loadingCards.map((card, index) => <div key={index} className="col-span-1" style={{ height: LOG_CARD_HEIGHT }}><LogCardSkeleton variant={card.variant} lines={card.lines} title={card.title} badge={card.badge} className="h-full w-full" /></div>)}</div> : logs.data?.logs.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1 auto-rows-min items-start">{logs.data.logs.map((log) => {
      let colSpan = "col-span-1";
      if (log.width) {
        if (log.width > 900) colSpan = "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4";
        else if (log.width > 600) colSpan = "col-span-1 md:col-span-2 lg:col-span-3";
        else if (log.width > 350) colSpan = "col-span-1 md:col-span-2";
      }
      return <div key={log.id} className={colSpan}><LogCard log={log} tasks={tasksByLog[log.id]} onToggleTask={(id, done) => toggleTask.mutate({ id, done })} onDuplicate={() => duplicateLog.mutate(log.id)} gridMode fixedHeight={LOG_CARD_HEIGHT} /></div>;
    })}</div> : <Empty className="border"><EmptyHeader><EmptyTitle>No Logs found</EmptyTitle><EmptyDescription>Try another tag or date range, or create a new Log.</EmptyDescription></EmptyHeader></Empty>}
    {logs.data ? <SimplePagination page={logs.data.page} hasMore={logs.data.hasMore} onPageChange={setPage} /> : null}
  </main>;
}
