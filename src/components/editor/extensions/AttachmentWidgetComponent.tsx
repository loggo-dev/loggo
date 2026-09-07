import * as React from "react";
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction } from "@/components/ui/attachment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ImagePreviewDialog } from "@/components/image-preview-dialog";
import { DownloadIcon, ExternalLinkIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import { FileIcon, ImageIcon } from "lucide-react";

export function AttachmentWidgetComponent({ title, ext, isImage, resolvedUrl, workspaceId, onDelete }: { title: string; ext: string; isImage: boolean; resolvedUrl: string; workspaceId?: string; onDelete?: () => void }) {
  const filename = resolvedUrl.slice("./_files/".length);
  const id = filename.split("-")[0];
  const finalUrl = workspaceId && resolvedUrl.startsWith("./_files/") ? `/api/workspaces/${workspaceId}/attachments/${id}/file` : resolvedUrl;

  const innerContent = (
    <>
      <AttachmentMedia variant={isImage ? "image" : "icon"}>
        {isImage ? (
          <img src={finalUrl} alt={title} draggable={false} className="aspect-square w-full object-cover" />
        ) : (
          <FileIcon className="text-muted-foreground" />
        )}
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{title}</AttachmentTitle>
        <AttachmentDescription>{ext}</AttachmentDescription>
      </AttachmentContent>
    </>
  );

  return (
    <Attachment data-slot="attachment" className="w-fit pr-4 max-w-64 relative group/menu focus-within:ring-1 focus-within:ring-ring transition-colors flex-none snap-start my-1 mx-1">
      {isImage ? (
        <ImagePreviewDialog
          src={finalUrl}
          alt={title}
          trigger={<button type="button" className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity min-w-0" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.preventDefault()}>{innerContent}</button>}
        />
      ) : (
        <div className="flex items-center gap-2 flex-1 cursor-pointer no-underline min-w-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          {innerContent}
        </div>
      )}
      <AttachmentActions
        className="opacity-0 focus-within:opacity-100 group-hover/menu:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        // Focusing the trigger button (a real focusable element living
        // inside CodeMirror's contentEditable region, as part of this
        // replace-decoration widget) can shift the browser's native
        // selection into the widget's DOM. If CodeMirror's DOM observer
        // then reads that as the document selection landing strictly
        // inside the attachment's markdown range, it refuses to apply the
        // replace decoration there (so a selection can't get trapped
        // inside a widget) - the widget instantly reverts to raw markdown
        // text, which reads as "the menu opens then disappears". Blocking
        // the mousedown's default focus behavior (same trick TaskCheckboxWidget
        // uses in checkboxes.ts) keeps focus - and the selection - on the
        // editor, so this never happens.
        onMouseDown={(e) => e.preventDefault()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<AttachmentAction><MoreVerticalIcon /></AttachmentAction>} />
          {/* Rendered through a portal to document.body, outside the card's
              own DOM subtree - the card's "click outside closes edit mode"
              listener (log-card.tsx) needs this marker to recognize a click
              here as still inside the editor (see SlashCommandMenu, which
              carries the same marker for the same reason). Without it, the
              first click on a menu item closes edit mode - unmounting the
              editor, and the menu with it - before the click can act. */}
          <DropdownMenuContent align="end" className="w-56" data-markdown-editor-popover="">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(finalUrl, '_blank'); }}><ExternalLinkIcon data-icon="inline-start" />Open in new tab</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              const a = document.createElement('a');
              a.href = finalUrl;
              a.download = title;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}><DownloadIcon data-icon="inline-start" />Download</DropdownMenuItem>
            {onDelete ? <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2Icon data-icon="inline-start" />Delete</DropdownMenuItem>
            </> : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </AttachmentActions>
    </Attachment>
  );
}
