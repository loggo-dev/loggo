import { WidgetType } from "@codemirror/view";

export class AttachmentWidget extends WidgetType {
  constructor(
    readonly title: string,
    readonly ext: string,
    readonly isImage: boolean,
    readonly resolvedUrl: string
  ) {
    super();
  }

  eq(other: AttachmentWidget) {
    return other.title === this.title && other.ext === this.ext && other.isImage === this.isImage && other.resolvedUrl === this.resolvedUrl;
  }

  toDOM() {
    const container = document.createElement("div");
    // Emulate the group/attachment classes and size=default, orientation=horizontal
    container.className = "cm-md-attachment-widget group/attachment relative inline-flex w-fit max-w-full min-w-40 shrink-0 items-center gap-2 rounded-xl border bg-card px-2.5 py-2 text-sm text-card-foreground transition-colors hover:bg-muted/50 cursor-text mx-1 my-1 align-middle";
    
    // Media container
    const media = document.createElement("div");
    media.className = "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground opacity-100";
    
    if (this.isImage) {
      // Image icon
      media.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>`;
    } else {
      // File icon
      media.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>`;
    }
    container.appendChild(media);

    // Content container
    const content = document.createElement("div");
    content.className = "max-w-full min-w-0 flex-1 leading-tight";
    
    const titleSpan = document.createElement("span");
    titleSpan.className = "block max-w-full min-w-0 truncate font-medium";
    titleSpan.textContent = this.title;
    content.appendChild(titleSpan);

    const extSpan = document.createElement("span");
    extSpan.className = "mt-0.5 block min-w-0 truncate text-xs text-muted-foreground max-w-full uppercase";
    extSpan.textContent = this.ext;
    content.appendChild(extSpan);

    container.appendChild(content);

    return container;
  }

  ignoreEvent() {
    return false;
  }
}
