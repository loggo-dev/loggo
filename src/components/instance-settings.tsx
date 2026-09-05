"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_TYPES = "*/*";

function InstanceSettingsForm({ initial }: { initial: Record<string, string> }) {
  const queryClient = useQueryClient();
  const [backend, setBackend] = useState(initial.storageBackend ?? "local");
  const [path, setPath] = useState(initial.mirrorPath ?? "./data");
  const [maxSize, setMaxSize] = useState(initial.maxAttachmentSize ?? "10485760");
  const [types, setTypes] = useState(initial.allowedFileTypes ?? DEFAULT_TYPES);
  const [pageSize, setPageSize] = useState(initial.defaultPageSize ?? "10");
  const save = useMutation({ mutationFn: () => api.updateInstance({ storageBackend: backend, mirrorPath: path, maxAttachmentSize: maxSize, allowedFileTypes: types, defaultPageSize: pageSize }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["instance"] }); toast.success("Instance settings saved"); }, onError: (error) => toast.error(error.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };
  return <form onSubmit={submit} className="flex flex-col gap-5"><Card><CardHeader><CardTitle>Storage</CardTitle><CardDescription>Choose where Log files and attachments are written.</CardDescription></CardHeader><CardContent><FieldGroup><Field><FieldLabel>Backend</FieldLabel><Select value={backend} onValueChange={(value) => value && setBackend(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="local">Local filesystem</SelectItem><SelectItem value="s3">S3 compatible</SelectItem><SelectItem value="r2">Cloudflare R2</SelectItem></SelectGroup></SelectContent></Select><FieldDescription>Backend credentials stay in environment variables. Restart Loggo after changing the backend.</FieldDescription></Field><Field><FieldLabel htmlFor="mirror-path">Mirror path</FieldLabel><Input id="mirror-path" value={path} onChange={(event) => setPath(event.target.value)} /></Field></FieldGroup></CardContent></Card>
    <Card><CardHeader><CardTitle>Attachments</CardTitle><CardDescription>Limits applied when users upload a file.</CardDescription></CardHeader><CardContent><FieldGroup><Field><FieldLabel htmlFor="max-size">Maximum size in bytes</FieldLabel><Input id="max-size" inputMode="numeric" value={maxSize} onChange={(event) => setMaxSize(event.target.value)} /></Field><Field><FieldLabel htmlFor="allowed-types">Allowed MIME types</FieldLabel><Input id="allowed-types" value={types} onChange={(event) => setTypes(event.target.value)} /><FieldDescription>Comma-separated values.</FieldDescription></Field></FieldGroup></CardContent></Card>
    <Card><CardHeader><CardTitle>UI</CardTitle><CardDescription>Customize the interface defaults.</CardDescription></CardHeader><CardContent><FieldGroup><Field><FieldLabel htmlFor="page-size">Default page size</FieldLabel><Input id="page-size" inputMode="numeric" value={pageSize} onChange={(event) => setPageSize(event.target.value)} /><FieldDescription>Number of items to show per page in lists.</FieldDescription></Field></FieldGroup></CardContent><CardFooter className="justify-end"><Button type="submit" disabled={save.isPending}>Save settings</Button></CardFooter></Card>
  </form>;
}

export function InstanceSettings() {
  const instance = useQuery({ queryKey: ["instance"], queryFn: api.instance });
  if (!instance.data) return <Skeleton className="h-72 w-full" />;
  return <InstanceSettingsForm initial={instance.data.settings} />;
}
