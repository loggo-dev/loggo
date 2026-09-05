"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { LogEditor } from "@/components/log-editor";
import { MarkdownPreview } from "@/components/markdown-preview";
import { useWorkspace } from "@/components/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LogDetailView({ id }: { id: string }) {
  const [editing, setEditing] = useState(false);
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const log = useQuery({ queryKey: ["log", workspace.id, id], queryFn: () => api.log(workspace.id, id) });
  const update = useMutation({ mutationFn: (values: { title: string | null; body: string }) => api.updateLog(workspace.id, id, values), onSuccess: () => { setEditing(false); void queryClient.invalidateQueries({ queryKey: ["log", workspace.id, id] }); toast.success("Log saved"); }, onError: (error) => toast.error(error.message) });
  if (log.isLoading) return <main className="page-shell"><Skeleton className="h-80 w-full" /></main>;
  if (!log.data) return <main className="page-shell"><p>Log not found.</p></main>;
  const data = log.data;
  const pasteFile = async (file: File) => (await api.uploadAttachment(workspace.id, id, file)).relativeLink;
  return <main className="page-shell"><div className="flex items-center justify-between"><Button variant="ghost" nativeButton={false} render={<Link href={`/d/${data.day}`} />}><ArrowLeftIcon data-icon="inline-start" />{data.day}</Button><Button variant="outline" onClick={() => setEditing((value) => !value)}><PencilIcon data-icon="inline-start" />{editing ? "Close editor" : "Edit"}</Button></div>
    <Card>{editing ? <CardContent><LogEditor initialTitle={data.title ?? ""} initialBody={data.body} tags={data.tags} saving={update.isPending} onSave={(values) => update.mutate(values)} onCancel={() => setEditing(false)} onPasteFile={pasteFile} titleClassName="text-2xl md:text-2xl font-heading font-medium leading-snug" /></CardContent> : <><CardHeader><CardTitle className="text-2xl">{data.title ?? "Untitled Log"}</CardTitle><p className="text-sm text-muted-foreground">{data.author.name} · {new Date(data.createdAt).toLocaleString()}</p></CardHeader><CardContent><MarkdownPreview body={data.body} workspaceId={workspace.id} /></CardContent><CardFooter className="flex-wrap gap-2">{data.tags.map((tag) => <Badge key={tag} variant="secondary">#{tag}</Badge>)}</CardFooter></>}</Card>
  </main>;
}
