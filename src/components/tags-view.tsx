"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HashIcon } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { PageTitle } from "@/components/page-title";
import { useWorkspace } from "@/components/workspace-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { LogFilterMenu } from "@/components/log-filter-menu";

export function TagsView() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { workspace } = useWorkspace();
  
  const queryParams: Record<string, string | number> = { page };
  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  
  const tags = useQuery({ queryKey: ["tags", workspace.id, page, from, to], queryFn: () => api.tags(workspace.id, queryParams) });
  
  return <main className="page-shell"><PageTitle title="Tags" description="Tags found in this workspace." />
    <div className="mb-4">
      <LogFilterMenu from={from} to={to} onFromChange={(val) => { setFrom(val); setPage(1); }} onToChange={(val) => { setTo(val); setPage(1); }} />
    </div>
    {tags.data?.tags.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tags.data.tags.map((tag) => <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`}><Card className="transition-colors hover:bg-muted/30"><CardContent className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-muted"><HashIcon /></span><span className="flex flex-1 flex-col"><span className="font-medium">{tag.name}</span><span className="text-xs text-muted-foreground">{tag.count} {tag.count === 1 ? "Log" : "Logs"}</span></span></CardContent></Card></Link>)}</div> : <Empty className="border"><EmptyHeader><EmptyTitle>No tags found</EmptyTitle><EmptyDescription>Try another date range, or type #tag inside a Log.</EmptyDescription></EmptyHeader></Empty>}
    {tags.data ? <SimplePagination page={tags.data.page} hasMore={tags.data.hasMore} onPageChange={setPage} /> : null}
  </main>;
}
