import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { WidgetType, EditorView } from "@codemirror/view";
import { YoutubeWidgetComponent } from "./YoutubeWidgetComponent";

export class YoutubeWidget extends WidgetType {
  private root: Root | null = null;

  constructor(
    readonly videoId: string,
    readonly title: string
  ) {
    super();
  }

  eq(other: YoutubeWidget) {
    return other.videoId === this.videoId && other.title === this.title;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("span");
    container.className = "cm-md-youtube block";
    // We add contentEditable="false" so the browser doesn't try to place the caret inside the widget
    container.contentEditable = "false";
    container.style.userSelect = "none";

    this.root = createRoot(container);
    this.root.render(<YoutubeWidgetComponent videoId={this.videoId} title={this.title} />);
    return container;
  }

  destroy(dom: HTMLElement) {
    if (this.root) {
      const root = this.root;
      setTimeout(() => root.unmount(), 0);
    }
  }

  ignoreEvent(event: Event) {
    return true; // CodeMirror shouldn't handle clicks inside the iframe
  }
}
