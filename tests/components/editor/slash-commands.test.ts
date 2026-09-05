import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { defaultEditorCommands, filterEditorCommands } from "@/components/editor/commands/editorCommands";
import { slashRangeField } from "@/components/editor/extensions/slashCommands";

function stateAt(doc: string, pos: number) {
  return EditorState.create({ doc, selection: { anchor: pos }, extensions: [markdown(), slashRangeField] });
}

describe("slashRangeField", () => {
  it("opens for a bare slash on an empty line", () => {
    expect(stateAt("/", 1).field(slashRangeField)).toEqual({ from: 0, to: 1 });
  });

  it("keeps tracking the range as a command name is typed", () => {
    expect(stateAt("  /hea", 6).field(slashRangeField)).toEqual({ from: 2, to: 6 });
  });

  it("does not open mid-sentence", () => {
    expect(stateAt("write /task", 11).field(slashRangeField)).toBeNull();
  });

  it("does not open once the selection is non-empty", () => {
    const state = EditorState.create({ doc: "/task", selection: { anchor: 0, head: 5 }, extensions: [markdown(), slashRangeField] });
    expect(state.field(slashRangeField)).toBeNull();
  });

  it("does not open inside a fenced code block", () => {
    const doc = "```\n/\n```";
    expect(stateAt(doc, doc.indexOf("/") + 1).field(slashRangeField)).toBeNull();
  });
});

describe("filterEditorCommands", () => {
  it("returns the full registry for an empty query", () => {
    expect(filterEditorCommands(defaultEditorCommands, "")).toHaveLength(defaultEditorCommands.length);
  });

  it("filters by label", () => {
    expect(filterEditorCommands(defaultEditorCommands, "ta").map((c) => c.id)).toEqual(["task"]);
  });

  it("filters by keyword", () => {
    expect(filterEditorCommands(defaultEditorCommands, "hr").map((c) => c.id)).toEqual(["divider"]);
  });

  it("is case-insensitive", () => {
    expect(filterEditorCommands(defaultEditorCommands, "HEADING 1").map((c) => c.id)).toEqual(["heading-1"]);
  });
});
