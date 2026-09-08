import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { WidgetType, EditorView } from "@codemirror/view";
import { AttachmentWidgetComponent } from "./AttachmentWidgetComponent";

// toDOM/updateDOM/destroy stash the mounted React root (and the widget
// instance it was rendered from) directly on the container element, so a
// later update can compare against and reuse the existing root instead of
// remounting - these aren't real DOM properties, hence the extended type.
type AttachmentWidgetDOM = HTMLElement & { reactRoot?: Root; widgetState?: AttachmentWidget };

export class AttachmentWidget extends WidgetType {
  constructor(
    readonly title: string,
    readonly ext: string,
    readonly isImage: boolean,
    readonly resolvedUrl: string,
    readonly markerFrom: number,
    readonly markerTo: number,
    readonly workspaceId?: string
  ) {
    super();
  }

  eq(other: AttachmentWidget) {
    // Return true only if EVERYTHING is identical, including position.
    // If position changed, we return false so updateDOM is called!
    return other.title === this.title && other.ext === this.ext && other.isImage === this.isImage && other.resolvedUrl === this.resolvedUrl && other.markerFrom === this.markerFrom && other.markerTo === this.markerTo && other.workspaceId === this.workspaceId;
  }

  updateDOM(dom: HTMLElement, view: EditorView) {
    const element = dom as AttachmentWidgetDOM;
    const other = element.widgetState;
    // Only update if the visual properties are the same (so we can reuse the component)
    if (other && other.title === this.title && other.ext === this.ext && other.isImage === this.isImage && other.resolvedUrl === this.resolvedUrl && other.workspaceId === this.workspaceId) {
      const root = element.reactRoot;
      if (root) {
        element.widgetState = this;
        root.render(
          <AttachmentWidgetComponent 
            title={this.title} 
            ext={this.ext} 
            isImage={this.isImage} 
            resolvedUrl={this.resolvedUrl} 
            workspaceId={this.workspaceId}
            onDelete={() => {
              view.dispatch({ changes: { from: this.markerFrom, to: this.markerTo, insert: "" } });
            }}
          />
        );
        return true;
      }
    }
    return false;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("span");
    container.className = "cm-md-attachment-widget-container";
    // Without this, focusing an interactive element inside the widget (e.g.
    // the "..." menu trigger) can land the browser's native selection inside
    // this replaced range. CodeMirror then refuses to render the replace
    // decoration there (so a selection can't get trapped inside a widget),
    // and the widget instantly reverts to raw markdown - same fix already
    // used in TableWidgetComponent.tsx and youtubeWidget.tsx.
    container.contentEditable = "false";

    const root = createRoot(container);
    const element = container as AttachmentWidgetDOM;
    element.reactRoot = root;
    element.widgetState = this;
    
    root.render(
      <AttachmentWidgetComponent 
        title={this.title} 
        ext={this.ext} 
        isImage={this.isImage} 
        resolvedUrl={this.resolvedUrl} 
        workspaceId={this.workspaceId}
        onDelete={() => {
          view.dispatch({ changes: { from: this.markerFrom, to: this.markerTo, insert: "" } });
        }}
      />
    );

    return container;
  }

  destroy(dom: HTMLElement) {
    const root = (dom as AttachmentWidgetDOM).reactRoot;
    if (root) {
      setTimeout(() => root.unmount(), 0);
    }
  }

  ignoreEvent(event: Event) {
    if (event.target instanceof HTMLElement) {
      if (event.target.closest('button') || event.target.closest('a') || event.target.closest('.group\\/menu')) {
        return true;
      }
    }
    return false;
  }
}
