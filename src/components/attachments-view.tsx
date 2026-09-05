"use client";
/* eslint-disable @next/next/no-img-element */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { PageTitle } from "@/components/page-title";
import { useWorkspace } from "@/components/workspace-provider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Attachment, AttachmentContent, AttachmentMedia, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction } from "@/components/ui/attachment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { AttachmentFilterMenu } from "@/components/attachment-filter-menu";
import { DownloadIcon, ExternalLinkIcon, MoreVerticalIcon } from "lucide-react";

function fileSize(size: number) {
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsView() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [extension, setExtension] = useState("all");
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryParams: Record<string, string | number> = { page };
  if (from) queryParams.from = from;
  if (to) queryParams.to = to;
  if (extension !== "all") queryParams.extension = extension;

  const extensions = useQuery({ queryKey: ["attachment-extensions", workspace.id], queryFn: () => api.attachmentExtensions(workspace.id) });
  const attachments = useQuery({ queryKey: ["attachments", workspace.id, page, from, to, extension], queryFn: () => api.attachments(workspace.id, queryParams) });
  const remove = useMutation({
    mutationFn: (attachmentId: string) => api.deleteAttachment(workspace.id, attachmentId),
    onSuccess: () => {
      setDeleteId(null);
      void queryClient.invalidateQueries({ queryKey: ["attachments", workspace.id] });
      toast.success("Attachment deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="page-shell">
      <PageTitle title="Attachments" description="Files uploaded to Logs in this workspace." />
      <div className="mb-4">
        <AttachmentFilterMenu
          extension={extension}
          onExtensionChange={(value) => { setExtension(value); setPage(1); }}
          extensions={extensions.data?.extensions}
          from={from}
          to={to}
          onFromChange={(val) => { setFrom(val); setPage(1); }}
          onToChange={(val) => { setTo(val); setPage(1); }}
        />
      </div>
      {attachments.data?.attachments.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {attachments.data.attachments.map(({ attachment, logTitle, day }) => {
            const url = `/api/workspaces/${workspace.id}/attachments/${attachment.id}/file`;
            const image = attachment.mime.startsWith("image/");
            const text = attachment.filename.replace(`${attachment.id}-`, "");
            const ext = text.split('.').pop()?.toUpperCase() || 'FILE';

            const innerContent = (
              <>
                <AttachmentMedia variant={image ? "image" : "icon"}>
                  {image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={url} alt={text} />
                  ) : (
                    <FileIcon />
                  )}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle className="truncate">{text}</AttachmentTitle>
                  <AttachmentDescription className="flex justify-between items-center pr-1">
                    <span>{ext} · {fileSize(attachment.size)}</span>
                    <Link href={`/logs/${attachment.logId}`} className="hover:underline text-muted-foreground z-10 relative" onClick={(e) => e.stopPropagation()}>{logTitle ?? day}</Link>
                  </AttachmentDescription>
                </AttachmentContent>
              </>
            );

            const card = (
              <Attachment key={attachment.id} data-slot="attachment" className="w-full relative group/menu focus-within:ring-1 focus-within:ring-ring transition-colors">
                {image ? (
                  <Dialog>
                    <DialogTrigger render={<button type="button" className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} />}>
                      {innerContent}
                    </DialogTrigger>
                    <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] border-none bg-transparent p-0 shadow-none flex items-center justify-center">
                      <DialogTitle className="sr-only">{text}</DialogTitle>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={text} className="w-full h-full object-contain" />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <a href={url} target="_blank" rel="noreferrer" className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer no-underline hover:opacity-80 transition-opacity">
                    {innerContent}
                  </a>
                )}
                
                <AttachmentActions className="opacity-0 focus-within:opacity-100 group-hover/menu:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<AttachmentAction><MoreVerticalIcon /></AttachmentAction>} />
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => window.open(url, '_blank')}><ExternalLinkIcon data-icon="inline-start" />Open in new tab</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = text;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}><DownloadIcon data-icon="inline-start" />Download</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(attachment.id)}>
                        <Trash2Icon data-icon="inline-start" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AttachmentActions>
              </Attachment>
            );

            return (
              <ContextMenu key={attachment.id}>
                <ContextMenuTrigger render={<div className="block" />}>
                  {card}
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56" align="end">
                  <ContextMenuItem onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); }}>
                    <ExternalLinkIcon data-icon="inline-start" />Open in new tab
                  </ContextMenuItem>
                  <ContextMenuItem onClick={(e) => {
                    e.stopPropagation();
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = text;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}>
                    <DownloadIcon data-icon="inline-start" />Download
                  </ContextMenuItem>
                  <ContextMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(attachment.id); }}>
                    <Trash2Icon data-icon="inline-start" />Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      ) : (
        <Empty className="border"><EmptyHeader><EmptyTitle>No attachments yet</EmptyTitle><EmptyDescription>Paste an image into an existing Log editor to upload it.</EmptyDescription></EmptyHeader></Empty>
      )}
      {attachments.data ? <SimplePagination page={attachments.data.page} hasMore={attachments.data.hasMore} onPageChange={setPage} /> : null}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this attachment?</AlertDialogTitle><AlertDialogDescription>The file will be removed from this Log and cannot be opened again.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={!deleteId || remove.isPending} onClick={() => deleteId && remove.mutate(deleteId)}>Delete attachment</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
