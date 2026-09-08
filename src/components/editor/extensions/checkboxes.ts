import { Decoration, EditorView, WidgetType } from "@codemirror/view";

// toDOM stashes the checked state used to render this button directly on
// the element, so updateDOM can tell whether the existing DOM can be reused
// as-is - not a real DOM property, hence the extended type.
type CheckboxDOM = HTMLButtonElement & { checkedState?: boolean };

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

  updateDOM(dom: HTMLElement, view: EditorView) {
    if ((dom as CheckboxDOM).checkedState === this.checked) {
      dom.onclick = (event) => {
        event.preventDefault();
        view.dispatch({
          changes: { from: this.markerFrom + 1, to: this.markerFrom + 2, insert: this.checked ? " " : "x" },
        });
      };
      return true;
    }
    return false;
  }

  toDOM(view: EditorView) {
    const box = document.createElement("button") as CheckboxDOM;
    box.checkedState = this.checked;
    box.type = "button";
    box.className = "cm-md-task-checkbox relative inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none align-middle cursor-pointer mx-1.5" + (this.checked ? " bg-primary border-primary text-primary-foreground" : " dark:bg-input/30");
    box.setAttribute("aria-label", this.checked ? "Mark task as not done" : "Mark task as done");
    if (this.checked) {
      box.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    }
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
