import { describe, expect, it } from "vitest";
import { classifyLog, extractSnippet } from "@/lib/classify-log";

describe("classifyLog", () => {
  it("classifies an empty or prose body as text", () => {
    expect(classifyLog("")).toBe("text");
    expect(classifyLog("   \n  ")).toBe("text");
    expect(classifyLog("Just a note about the deploy.")).toBe("text");
  });

  it("classifies a body of only checkbox lines as task", () => {
    expect(classifyLog("- [ ] ship the fix\n- [x] write tests")).toBe("task");
    expect(classifyLog("  * [ ] indented\n+ [x] plus bullet")).toBe("task");
  });

  it("ignores blank lines between checkboxes", () => {
    expect(classifyLog("- [ ] one\n\n- [ ] two\n   \n- [x] three")).toBe("task");
  });

  it("does not classify mixed prose and checkboxes as task", () => {
    expect(classifyLog("Notes\n- [ ] follow up")).toBe("text");
  });

  it("classifies a single fenced code block as snippet", () => {
    expect(classifyLog("```ts\nconst x = 1;\n```")).toBe("snippet");
    expect(classifyLog("```\nplain\nblock\n```")).toBe("snippet");
  });

  it("does not classify a fence with surrounding text as snippet", () => {
    expect(classifyLog("caption\n```ts\nconst x = 1;\n```")).toBe("text");
    expect(classifyLog("```ts\nconst x = 1;\n```\ncaption")).toBe("text");
  });

  it("does not classify multiple fences as snippet", () => {
    expect(classifyLog("```ts\na\n```\n```ts\nb\n```")).toBe("text");
  });

  it("classifies a single image link as attachment", () => {
    expect(classifyLog("![screenshot](./_files/shot.png)")).toBe("attachment");
    expect(classifyLog("  ![alt text](./_files/shot.png)  \n")).toBe("attachment");
  });

  it("does not classify an image with a caption as attachment", () => {
    expect(classifyLog("![screenshot](./_files/shot.png)\ncaption below")).toBe("text");
  });
});

describe("extractSnippet", () => {
  it("extracts the language and code from a fenced block", () => {
    expect(extractSnippet("```ts\nconst x = 1;\n```")).toEqual({ language: "ts", code: "const x = 1;" });
  });

  it("handles a fence with no language", () => {
    expect(extractSnippet("```\nplain\n```")).toEqual({ language: undefined, code: "plain" });
  });

  it("returns null when the body is not a single fenced block", () => {
    expect(extractSnippet("caption\n```ts\nconst x = 1;\n```")).toBeNull();
    expect(extractSnippet("not a snippet")).toBeNull();
  });
});
