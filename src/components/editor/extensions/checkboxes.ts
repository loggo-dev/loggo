import { Decoration, EditorView, WidgetType } from "@codemirror/view";

// Replaces a GFM `TaskMarker` node's raw "[ ]" / "[x]" text with a real
// checkbox. Clicking it flips the single character inside the brackets,
// keeping Markdown as the only source of truth (no parallel task model).
export class TaskCheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly markerFrom: number,
  ) {
    super();
  }

  eq(other: TaskCheckboxWidget) {
    return other.checked === this.checked && other.markerFrom === this.markerFrom;
  }

  toDOM(view: EditorView) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = this.checked;
    box.className = "cm-md-task-checkbox";
    box.setAttribute("aria-label", this.checked ? "Mark task as not done" : "Mark task as done");
    // Prevent the mousedown from moving the CodeMirror caret before the click fires.
    box.onmousedown = (event) => event.preventDefault();
    box.onclick = (event) => {
      event.preventDefault();
      view.dispatch({
        changes: { from: this.markerFrom + 1, to: this.markerFrom + 2, insert: this.checked ? " " : "x" },
      });
    };
    return box;
  }

  ignoreEvent() {
    return false;
  }
}

export function taskCheckboxDecoration(markerFrom: number, checked: boolean) {
  return Decoration.replace({ widget: new TaskCheckboxWidget(checked, markerFrom) });
}
