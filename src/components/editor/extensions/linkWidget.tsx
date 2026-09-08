import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { WidgetType, EditorView } from "@codemirror/view";
import { LinkWidgetComponent } from "./LinkWidgetComponent";

type LinkWidgetDOM = HTMLElement & { reactRoot?: Root; widgetState?: LinkWidget };

export class LinkWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly url: string,
    readonly markerFrom: number,
    readonly markerTo: number
  ) {
    super();
  }

  eq(other: LinkWidget) {
    return other.text === this.text && other.url === this.url && other.markerFrom === this.markerFrom && other.markerTo === this.markerTo;
  }

  updateDOM(dom: HTMLElement, view: EditorView) {
    const element = dom as LinkWidgetDOM;
    const other = element.widgetState;
    if (other && other.text === this.text && other.url === this.url) {
      if (element.reactRoot) {
        element.widgetState = this;
        element.reactRoot.render(
          <LinkWidgetComponent text={this.text} url={this.url} markerFrom={this.markerFrom} view={view} />
        );
        return true;
      }
    }
    return false;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("span");
    container.contentEditable = "false";
    container.className = "cm-md-link-widget";
    const root = createRoot(container);
    (container as LinkWidgetDOM).reactRoot = root;
    (container as LinkWidgetDOM).widgetState = this;
    
    root.render(
      <LinkWidgetComponent text={this.text} url={this.url} markerFrom={this.markerFrom} view={view} />
    );
    return container;
  }

  destroy(dom: HTMLElement) {
    const element = dom as LinkWidgetDOM;
    if (element.reactRoot) {
      const root = element.reactRoot;
      setTimeout(() => root.unmount(), 0);
    }
  }

  ignoreEvent(event: Event) {
    if (event.type === "mousedown") return false;
    if (event.target instanceof HTMLElement) {
      if (event.target.closest('button') || event.target.closest('a') || event.target.closest('.group\\/link-popover')) {
        return true;
      }
    }
    return false;
  }
}
