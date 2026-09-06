"use client";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/code-block";
import { Checkbox } from "@/components/ui/checkbox";
import { Attachment, AttachmentContent, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction } from "@/components/ui/attachment";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogClose, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { useCanvasInteraction } from "@/components/canvas-provider";
import { FileIcon, DownloadIcon, ExternalLinkIcon, MoreVerticalIcon, Trash2Icon, VideoIcon, XIcon } from "lucide-react";
import type { TaskSummary } from "@/lib/api-client";
import { cn, humanizeDate } from "@/lib/utils";

function textContent(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (isValidElement<{ children?: unknown }>(node)) return textContent(node.props.children);
  return "";
}

function stripTrailingDate(nodes: ReactNode[], badgeNode?: ReactNode): { stripped: ReactNode[]; found: boolean } {
  const result = [...nodes];
  for (let i = result.length - 1; i >= 0; i--) {
    const node = result[i];
    if (typeof node === "string") {
      const replaced = node.replace(/(?:^|\s)!([\p{L}\d-]+)\s*$/u, "");
      if (replaced !== node) {
        result[i] = badgeNode ? <>{replaced}{badgeNode}</> : replaced;
        return { stripped: result, found: true };
      }
      if (node.trim() !== "") return { stripped: result, found: false };
    } else if (isValidElement<{ children?: ReactNode }>(node)) {
      if (node.props.children) {
        const childrenArray = Children.toArray(node.props.children);
        const { stripped, found } = stripTrailingDate(childrenArray, badgeNode);
        if (found) {
          result[i] = cloneElement(node as ReactElement<{ children: ReactNode }>, {}, ...stripped);
          return { stripped: result, found: true };
        }
      }
      return { stripped: result, found: false };
    }
  }
  return { stripped: result, found: false };
}

const ATTACHMENT_PATTERN = /(?:!\[([^\]]*)\]|\[([^\]]*)\])\(<?(\.\/_files\/[^)>\s]+)>?\)/g;

const YOUTUBE_PATTERN = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:\S*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function youtubeVideoId(href: string) {
  return href.match(YOUTUBE_PATTERN)?.[1] ?? null;
}

export function MarkdownPreview({ body, workspaceId, tasks, onToggleTask, onDeleteAttachment, highlightCode = true, clampCode = false, compact = false }: { body: string; workspaceId?: string; tasks?: TaskSummary[]; onToggleTask?: (taskId: string, done: boolean) => void; onDeleteAttachment?: (attachmentId: string, markdown: string) => void; highlightCode?: boolean; clampCode?: boolean; compact?: boolean }) {
  // Chrome blanks a cross-origin iframe (YouTube embeds) while an ancestor's
  // CSS transform is actively changing, which happens continuously while
  // panning/zooming the day board's canvas - swap in a static placeholder
  // for the duration so it doesn't flash black. `useCanvasInteraction()` is
  // safe to call outside a canvas (e.g. the Logs grid) - `isInteracting` is
  // just always false there. It's a separate hook from `useCanvas()`'s
  // pan/zoom values on purpose, so a card's markdown doesn't re-render on
  // every tick of an unrelated pan/zoom gesture (see canvas-provider.tsx).
  const { isInteracting } = useCanvasInteraction();
  const matches = [...body.matchAll(ATTACHMENT_PATTERN)];
  const strippedBody = body.replace(ATTACHMENT_PATTERN, "").trim();

  return <div className={cn("flex flex-col h-full markdown", compact && "markdown-compact text-sm")}>
    {strippedBody ? (
      <div className="flex-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          img: ({ src, alt }) => <img src={src} alt={alt ?? "Image"} className="my-3 max-h-96 rounded-lg border object-contain" />,
          a: ({ href, children, title }) => {
            const videoId = typeof href === "string" ? youtubeVideoId(href) : null;
            if (videoId) return (
              <div className="relative my-3 aspect-video w-full overflow-hidden rounded-lg border" onClick={(event) => event.stopPropagation()}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                  title="YouTube video"
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
                {/* Kept mounted underneath rather than swapped out, so panning
                    the canvas never resets playback - this cover just hides
                    the momentary black flash. */}
                {isInteracting ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                    <VideoIcon className="size-8" />
                  </div>
                ) : null}
              </div>
            );
            return <a href={href} title={title} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noreferrer" : undefined}>{children}</a>;
          },
          pre: ({ children }) => {
            const code = isValidElement<{ className?: string; children?: unknown }>(children) ? children : null;
            const language = code?.props.className?.match(/language-(\S+)/)?.[1];
            return <div className="my-3"><CodeBlock code={textContent(code?.props.children).replace(/\n$/, "")} language={language} highlighted={highlightCode} clampHeight={clampCode} /></div>;
          },
          code: ({ className, children }) => {
            if (!highlightCode) return <code className={className}>{children}</code>;
            const language = className?.replace("language-", "") || "plaintext";
            return <CodeBlock language={language} code={textContent(children)} clampHeight={clampCode} />;
          },
          li: ({ node, className, children }) => {
            if (typeof className !== "string" || !className.includes("task-list-item")) return <li className={className}>{children}</li>;
            const items = Children.toArray(children);

            // remark-gfm nests the checkbox <input> inside a <p> for "loose" task
            // lists (e.g. a blank line between tasks), not as a direct <li> child -
            // search recursively so it's still found and stripped from `rest`,
            // otherwise it renders alongside our custom Checkbox as a second box.
            let foundCheckbox = false;
            let inputChecked = false;
            const stripCheckbox = (child: ReactNode): ReactNode => {
              if (foundCheckbox) return child;
              if (isValidElement<{ checked?: boolean }>(child) && child.type === "input") {
                foundCheckbox = true;
                inputChecked = child.props.checked ?? false;
                return null;
              }
              if (isValidElement<{ children?: ReactNode }>(child) && child.props.children != null) {
                const strippedChildren = Children.map(child.props.children, stripCheckbox);
                // A "loose" list (blank line between tasks) wraps the text in a <p>,
                // which picks up ".markdown p"'s margin and throws off alignment
                // with the checkbox - drop the wrapper so loose and tight lists
                // render identically.
                if (child.type === "p") return strippedChildren;
                return cloneElement(child, {}, strippedChildren);
              }
              return child;
            };
            let rest: ReactNode[] = items.map(stripCheckbox).filter((child) => child !== null);
            
            const lineNo = node?.position?.start.line;
            const task = tasks?.find((candidate) => candidate.lineNo === lineNo);
            const checked = task ? task.done : inputChecked;
            const isOverdue = task?.dueDate && !checked && new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
            
            if (task?.dueDate) {
              const badgeNode = <span className={cn("ml-1.5 inline-flex items-center justify-center rounded-full border px-1.5 text-[10px] h-4 font-semibold transition-colors align-text-bottom", isOverdue ? "border-destructive/50 text-destructive bg-destructive/10" : checked ? "border-transparent text-muted-foreground bg-muted" : "text-muted-foreground")}>{humanizeDate(task.dueDate)}</span>;
              const { stripped } = stripTrailingDate(rest, badgeNode);
              rest = stripped;
            }
            
            return <li className="flex list-none items-start gap-2 -ml-[26px] rounded-lg px-1.5 py-1 -my-1 transition-colors hover:bg-muted/50">
              <Checkbox checked={checked} disabled={!task || !onToggleTask} onCheckedChange={(value) => task && onToggleTask?.(task.id, value === true)} onClick={(event) => event.stopPropagation()} className="mt-1 shrink-0 cursor-pointer" />
              <span className={cn("min-w-0 flex-1", checked ? "text-muted-foreground line-through" : undefined)}>
                {rest}
              </span>
            </li>;
          },
        }}>{strippedBody}</ReactMarkdown>
      </div>
    ) : null}

    {matches.length > 0 ? (
      // -mx-2 px-2 gives the focus/hover ring on the first and last card room
      // inside the scrollable area - without it, overflow-x-auto clips the
      // ring flush against the container edge.
      <AttachmentGroup className="mt-auto pt-2 empty:hidden -mx-2 px-2">
        {matches.map((match, i) => {
          const text = match[1] || match[2] || "Attachment";
          const url = match[3];
          const isImage = match[0].startsWith("!");
          const filename = url.slice("./_files/".length);
          const id = filename.split("-")[0];
          const resolved = workspaceId ? `/api/workspaces/${workspaceId}/attachments/${id}/file` : url;
          const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';

          const innerContent = (
            <>
              <AttachmentMedia variant={isImage ? "image" : "icon"}>
                {isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={resolved} alt={text} draggable={false} />
                ) : (
                  <FileIcon />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{text}</AttachmentTitle>
                <AttachmentDescription>{ext}</AttachmentDescription>
              </AttachmentContent>
            </>
          );

          const card = (
            <Attachment data-slot="attachment" className="w-fit pr-4 max-w-64 relative group/menu focus-within:ring-1 focus-within:ring-ring transition-colors flex-none snap-start">
              {isImage ? (
                <Dialog>
                  <DialogTrigger render={<button type="button" className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity min-w-0" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} />}>
                    {innerContent}
                  </DialogTrigger>
                  <DialogContent showCloseButton={false} className="w-fit h-fit max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] border-none bg-transparent p-0 shadow-none flex items-center justify-center">
                    <DialogTitle className="sr-only">{text}</DialogTitle>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolved} alt={text} className="block max-w-[90vw] max-h-[90vh] w-auto h-auto rounded-lg object-contain" />
                    <DialogClose className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70" aria-label="Close">
                      <XIcon className="size-4" />
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              ) : (
                <a href={resolved} target="_blank" rel="noreferrer" className="flex items-center gap-2 flex-1 cursor-pointer no-underline hover:opacity-80 transition-opacity min-w-0" onClick={(e) => e.stopPropagation()}>
                  {innerContent}
                </a>
              )}

              <AttachmentActions 
                className="opacity-0 focus-within:opacity-100 group-hover/menu:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger render={<AttachmentAction><MoreVerticalIcon /></AttachmentAction>} />
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(resolved, '_blank'); }}><ExternalLinkIcon data-icon="inline-start" />Open in new tab</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      const a = document.createElement('a');
                      a.href = resolved;
                      a.download = text;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}><DownloadIcon data-icon="inline-start" />Download</DropdownMenuItem>
                    {onDeleteAttachment ? <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); onDeleteAttachment(id, match[0]); }}><Trash2Icon data-icon="inline-start" />Delete</DropdownMenuItem>
                    </> : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </AttachmentActions>
            </Attachment>
          );

          return (
            <ContextMenu key={i}>
              <ContextMenuTrigger render={<div className="flex-none snap-start" />}>
                {card}
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <ContextMenuItem onClick={(e) => { e.stopPropagation(); window.open(resolved, '_blank'); }}>
                  <ExternalLinkIcon data-icon="inline-start" />Open in new tab
                </ContextMenuItem>
                <ContextMenuItem onClick={(e) => {
                  e.stopPropagation();
                  const a = document.createElement('a');
                  a.href = resolved;
                  a.download = text;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}>
                  <DownloadIcon data-icon="inline-start" />Download
                </ContextMenuItem>
                {onDeleteAttachment ? <>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); onDeleteAttachment(id, match[0]); }}>
                    <Trash2Icon data-icon="inline-start" />Delete
                  </ContextMenuItem>
                </> : null}
              </ContextMenuContent>
            </ContextMenu>
          );
        })}
      </AttachmentGroup>
    ) : null}
  </div>;
}
