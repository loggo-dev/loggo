import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { WidgetType, EditorView } from "@codemirror/view";
import { CodeBlockWidgetComponent } from "./CodeBlockWidgetComponent";

export class CodeBlockWidget extends WidgetType {
  private root: Root | null = null;
  private cleanup: (() => void) | null = null;

  constructor(
    readonly language: string,
    readonly code: string
  ) {
    super();
  }

  eq(other: CodeBlockWidget) {
    return other.language === this.language && other.code === this.code;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("span");
    container.className = "cm-md-code-block-widget w-full block";

    this.root = createRoot(container);
    this.root.render(
      <CodeBlockWidgetComponent language={this.language} code={this.code} />
    );

    // Reveal the header's controls while hovering anywhere in the code
    // block, not just its header line - CodeMirror renders each source line
    // as its own DOM node, so this walks the block's contiguous sibling
    // lines (queued for after insertion, since `container` isn't in the
    // document yet here) and wires hover across all of them together.
    requestAnimationFrame(() => {
      const headerLine = container.closest(".cm-line");
      if (!headerLine) return;
      const lines: Element[] = [headerLine];
      let next = headerLine.nextElementSibling;
      while (next?.classList.contains("cm-md-codeblock")) {
        lines.push(next);
        next = next.nextElementSibling;
      }
      const show = () => container.classList.add("cm-md-code-block-widget--hovered");
      const hide = () => container.classList.remove("cm-md-code-block-widget--hovered");
      lines.forEach((line) => {
        line.addEventListener("mouseenter", show);
        line.addEventListener("mouseleave", hide);
      });
      this.cleanup = () => lines.forEach((line) => {
        line.removeEventListener("mouseenter", show);
        line.removeEventListener("mouseleave", hide);
      });
    });

    return container;
  }

  destroy(dom: HTMLElement) {
    this.cleanup?.();
    if (this.root) {
      const root = this.root;
      setTimeout(() => root.unmount(), 0);
    }
  }

  ignoreEvent(event: Event) {
    return true; // Ignore all events so clicking buttons works without CodeMirror stealing focus
  }
}
