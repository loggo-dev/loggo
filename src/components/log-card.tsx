"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BringToFrontIcon, CopyIcon, CopyPlusIcon, ExternalLinkIcon, FolderInputIcon, ListChecksIcon, PencilIcon, SendToBackIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api, type LogSummary, type TaskSummary } from "@/lib/api-client";
import { classifyLog } from "@/lib/classify-log";
import { useResize } from "@/hooks/use-resize";
import { useDragPosition } from "@/hooks/use-drag-position";
import { LogEditor } from "@/components/log-editor";
import { MarkdownPreview } from "@/components/markdown-preview";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/components/workspace-provider";

export type DragProps = { x: number; y: number; zIndex?: number | null; onMove: (x: number, y: number) => void; onBringToFront?: () => void; onSendToBack?: () => void; width?: number | null; height?: number | null; onResize?: (width: number, height: number) => void };

function ResizeHandle({ handlers }: { handlers: ReturnType<typeof useResize>["handlers"] }) {
  return <div
    className="group/resize absolute bottom-0 right-0 z-20 size-6 cursor-nwse-resize"
    aria-label="Resize Log"
    {...handlers}
  >
    <span className="pointer-events-none absolute right-1.5 bottom-1.5 size-2.5 rounded-br-sm border-r-2 border-b-2 border-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-50 group-hover/resize:opacity-80 group-active/resize:opacity-100" />
  </div>;
}

import { ScrollArea } from "@/components/ui/scroll-area";

export function CardBody({ log, workspaceId, tasks, onToggleTask, onDeleteAttachment, isResized }: { log: LogSummary; workspaceId: string; tasks?: TaskSummary[]; onToggleTask?: (taskId: string, done: boolean) => void; onDeleteAttachment?: (attachmentId: string, markdown: string) => void; isResized?: boolean }) {
  const shape = classifyLog(log.body);
  const containerClass = isResized ? "flex-1 min-h-0" : "max-h-80 [&>[data-slot=scroll-area-viewport]]:h-auto [&>[data-slot=scroll-area-viewport]]:max-h-80";

  const content = (() => {
    if (shape === "task") return <MarkdownPreview body={log.body} workspaceId={workspaceId} tasks={tasks} onToggleTask={onToggleTask} onDeleteAttachment={onDeleteAttachment} compact />;
    if (shape === "snippet") return <MarkdownPreview body={log.body} workspaceId={workspaceId} highlightCode={false} clampCode onDeleteAttachment={onDeleteAttachment} compact />;
    if (shape === "attachment") return <MarkdownPreview body={log.body} workspaceId={workspaceId} onDeleteAttachment={onDeleteAttachment} compact />;
    return <MarkdownPreview body={log.body} workspaceId={workspaceId} tasks={tasks} onToggleTask={onToggleTask} onDeleteAttachment={onDeleteAttachment} highlightCode={false} compact />;
  })();

  return (
    <ScrollArea className={`${containerClass} -mx-2 px-2`}>
      {content}
    </ScrollArea>
  );
}

export function LogCard({ log, tasks, onToggleTask, onDuplicate, drag, resize, clickToEdit, gridMode, fixedHeight }: { log: LogSummary; tasks?: TaskSummary[]; onToggleTask?: (taskId: string, done: boolean) => void; onDuplicate?: () => void; drag?: DragProps; resize?: { width?: number | null; height?: number | null; onResize: (w: number, h: number) => void }; clickToEdit?: boolean; gridMode?: boolean; fixedHeight?: number }) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { workspace, workspaces } = useWorkspace();
  const update = useMutation({ mutationFn: (values: { title: string | null; body: string }) => api.updateLog(workspace.id, log.id, values), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); }, onError: (error) => toast.error(error.message) });
  const remove = useMutation({ mutationFn: () => api.deleteLog(workspace.id, log.id), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); toast.success("Log deleted"); }, onError: (error) => toast.error(error.message) });
  const move = useMutation({ mutationFn: (targetWorkspaceId: string) => api.moveLog(workspace.id, log.id, targetWorkspaceId), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); void queryClient.invalidateQueries({ queryKey: ["tasks", workspace.id] }); toast.success("Log moved"); }, onError: (error) => toast.error(error.message) });
  const pasteFile = async (file: File) => (await api.uploadAttachment(workspace.id, log.id, file)).relativeLink;
  // Deleting an attachment from a card also has to strip its markdown
  // reference from the body - otherwise the card is left showing a broken
  // link to a file that no longer exists.
  const deleteAttachment = useMutation({
    mutationFn: async ({ attachmentId, markdown }: { attachmentId: string; markdown: string }) => {
      await api.deleteAttachment(workspace.id, attachmentId);
      return api.updateLog(workspace.id, log.id, { body: log.body.replace(markdown, "").replace(/\n{3,}/g, "\n\n").trim() });
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["logs", workspace.id] }); toast.success("Attachment deleted"); },
    onError: (error) => toast.error(error.message),
  });
  const taskCount = tasks?.length ?? 0;

  const dragPos = useDragPosition({
    x: drag?.x ?? 0,
    y: drag?.y ?? 0,
    onCommit: (x, y) => drag?.onMove(x, y),
    onClick: () => setEditing(true),
  });
  
  const resizeHook = useResize({
    width: drag?.width ?? resize?.width,
    height: drag?.height ?? resize?.height,
    onCommit: (w, h) => drag?.onResize?.(w, h) ?? resize?.onResize(w, h),
  });

  const positionStyle = drag ? { position: "absolute" as const, left: drag.x, top: drag.y, zIndex: drag.zIndex ?? 0, ...dragPos.style } : undefined;

  const resolvedStyle: CSSProperties = { ...resizeHook.style };
  if (gridMode && !resizeHook.isResizing) {
    delete resolvedStyle.width;
  }
  if (fixedHeight != null) resolvedStyle.height = fixedHeight;

  const editRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    const keyHandler = (event: KeyboardEvent) => { if (event.key === "Escape") setEditing(false); };
    const mouseHandler = (event: MouseEvent) => {
      if (editRef.current && !editRef.current.contains(event.target as Node)) {
        if ((event.target as Element).closest?.(".cm-tooltip, [data-markdown-editor-popover]")) return;
        setEditing(false);
      }
    };
    window.addEventListener("keydown", keyHandler);
    window.addEventListener("mousedown", mouseHandler);
    return () => { window.removeEventListener("keydown", keyHandler); window.removeEventListener("mousedown", mouseHandler); };
  }, [editing]);

  const router = useRouter();
  const showResize = drag != null || resize != null;

  if (editing) {
    const editCardProps = drag
      ? { className: `touch-none select-none flex flex-col z-0 ${dragPos.isDragging ? "shadow-sm" : ""}`, style: { ...positionStyle, ...resolvedStyle, cursor: dragPos.isDragging ? "grabbing" : undefined }, "data-log-id": log.id, ...dragPos.handlers }
      : { className: "mb-4 break-inside-avoid w-full z-0 flex flex-col", style: resolvedStyle };
    return <Card {...editCardProps} ref={editRef}><CardContent className={(drag || resize || fixedHeight != null) ? "flex-1 min-h-0 flex flex-col" : ""}><LogEditor initialTitle={log.title ?? ""} initialBody={log.body} tags={log.tags} saving={update.isPending} onSave={(values) => update.mutate(values)} onSubmit={(values) => { update.mutate(values); setEditing(false); }} onPasteFile={pasteFile} autoSave footerMessage={`Updated ${new Date(log.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${log.mirrorDirty ? " · mirror pending" : ""}`} /></CardContent>{showResize ? <ResizeHandle handlers={resizeHook.handlers} /> : null}</Card>;
  }

  const cardProps = drag
    ? { className: `cursor-grab touch-none select-none gap-1 transition-colors dark:hover:bg-[color-mix(in_oklab,var(--accent)_35%,var(--card))] flex flex-col z-0 ${dragPos.isDragging ? "shadow-sm" : ""}`, style: { ...positionStyle, ...resolvedStyle }, "data-log-id": log.id, ...dragPos.handlers }
    : { className: `relative mb-4 cursor-pointer break-inside-avoid gap-1 transition-colors dark:hover:bg-[color-mix(in_oklab,var(--accent)_35%,var(--card))] w-full z-0 flex flex-col`, style: resolvedStyle, onClick: clickToEdit ? () => setEditing(true) : () => router.push(`/d/${log.day}`) };
  
  const isResized = fixedHeight != null || (showResize && ((drag?.height ?? resize?.height) != null || resizeHook.style?.height != null));

  return <><ContextMenu><ContextMenuTrigger render={<Card {...cardProps} />}>
    {taskCount > 0 ? <Badge variant="secondary" className="absolute right-2 top-2 z-10 gap-1"><ListChecksIcon className="size-3" />{taskCount}</Badge> : null}
    {log.title ? <CardHeader className="shrink-0 pb-0"><CardTitle>{log.title}</CardTitle></CardHeader> : null}
    <CardContent className={`min-h-0 ${log.title ? "pt-0" : ""} ${isResized ? "flex-1 flex flex-col" : ""}`}><CardBody log={log} workspaceId={workspace.id} tasks={tasks} onToggleTask={onToggleTask} onDeleteAttachment={(attachmentId, markdown) => deleteAttachment.mutate({ attachmentId, markdown })} isResized={isResized} /></CardContent>
    {showResize ? <ResizeHandle handlers={resizeHook.handlers} /> : null}
  </ContextMenuTrigger><ContextMenuContent><ContextMenuGroup>
    <ContextMenuItem onClick={() => setEditing(true)}><PencilIcon />Edit</ContextMenuItem>
    <ContextMenuItem onClick={() => { void navigator.clipboard.writeText(log.body); toast.success("Markdown copied"); }}><CopyIcon />Copy as markdown</ContextMenuItem>
    <ContextMenuItem onClick={() => { void navigator.clipboard.writeText(`${location.origin}/d/${log.day}`); toast.success("Link copied"); }}><ExternalLinkIcon />Copy link</ContextMenuItem>
    {workspaces.length > 1 ? <ContextMenuSub><ContextMenuSubTrigger><FolderInputIcon />Move to workspace</ContextMenuSubTrigger><ContextMenuSubContent>{workspaces.filter((candidate) => candidate.id !== workspace.id).map((candidate) => <ContextMenuItem key={candidate.id} onClick={() => move.mutate(candidate.id)}>{candidate.name}</ContextMenuItem>)}</ContextMenuSubContent></ContextMenuSub> : null}
  </ContextMenuGroup>
  {(drag?.onBringToFront || drag?.onSendToBack || onDuplicate) ? <><ContextMenuSeparator /><ContextMenuGroup>
    {drag?.onBringToFront ? <ContextMenuItem onClick={drag.onBringToFront}><BringToFrontIcon />Bring to front</ContextMenuItem> : null}
    {drag?.onSendToBack ? <ContextMenuItem onClick={drag.onSendToBack}><SendToBackIcon />Send to back</ContextMenuItem> : null}
    {onDuplicate ? <ContextMenuItem onClick={onDuplicate}><CopyPlusIcon />Duplicate</ContextMenuItem> : null}
  </ContextMenuGroup></> : null}
  <ContextMenuSeparator />
  <ContextMenuGroup>
    <ContextMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2Icon />Delete</ContextMenuItem>
  </ContextMenuGroup></ContextMenuContent></ContextMenu>
  <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>Delete this Log?</AlertDialogTitle><AlertDialogDescription>This removes it from the board. Its day will not be changed.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove.mutate()}>Delete Log</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog></>;
}
