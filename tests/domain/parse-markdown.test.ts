import { describe, expect, it } from "vitest";
import { parseMarkdown, resolveDueDate } from "@/server/domain/parse-markdown";

describe("parseMarkdown", () => {
  it("finds unicode and nested tags but skips code, preprocessor directives, and colors", () => {
    const parsed = parseMarkdown([
      "#typescript #veri/tabanı #café",
      "`#inline` and color #fff and #aabbcc",
      "#include <stdio.h>",
      "```ts",
      "const ignored = '#inside-code';",
      "```",
      "real #after-code",
    ].join("\n"), "2026-09-04");
    expect(parsed.tags).toEqual(["typescript", "veri/tabanı", "café", "after-code"]);
  });

  it("parses nested checkboxes and every due-date format", () => {
    const parsed = parseMarkdown([
      "  - [ ] ship !2026-09-05",
      "    * [x] review !today",
      "+ [ ] follow up !tomorrow",
      "- [ ] publish !friday",
      "- [ ] keep unknown !someday",
    ].join("\n"), "2026-09-04");
    expect(parsed.tasks).toEqual([
      { text: "ship", done: false, dueDate: "2026-09-05", lineNo: 1 },
      { text: "review", done: true, dueDate: "2026-09-04", lineNo: 2 },
      { text: "follow up", done: false, dueDate: "2026-09-05", lineNo: 3 },
      { text: "publish", done: false, dueDate: "2026-09-11", lineNo: 4 },
      { text: "keep unknown !someday", done: false, dueDate: null, lineNo: 5 },
    ]);
  });

  it("finds relative attachment links outside fences", () => {
    const parsed = parseMarkdown("![shot](./_files/screen%20shot.png)\n[doc](./_files/design.pdf)\n```\n![no](./_files/no.png)\n```", "2026-09-04");
    expect(parsed.attachments).toEqual(["screen shot.png", "design.pdf"]);
  });

  it("resolves weekday names to the next occurrence", () => {
    expect(resolveDueDate("thursday", "2026-09-04")).toBe("2026-09-10");
  });
});
