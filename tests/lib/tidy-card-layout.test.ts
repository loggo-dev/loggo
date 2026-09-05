import { describe, expect, it } from "vitest";
import { tidyCardLayout } from "@/lib/tidy-card-layout";

describe("tidyCardLayout", () => {
  it("packs cards left to right with a consistent gap", () => {
    expect(tidyCardLayout([
      { id: "a", width: 200, height: 100 },
      { id: "b", width: 220, height: 120 },
    ], 600)).toEqual([
      { id: "a", x: 24, y: 24 },
      { id: "b", x: 240, y: 24 },
    ]);
  });

  it("wraps using the tallest card in the previous row", () => {
    expect(tidyCardLayout([
      { id: "a", width: 240, height: 100 },
      { id: "b", width: 240, height: 160 },
      { id: "c", width: 240, height: 90 },
    ], 560)).toEqual([
      { id: "a", x: 24, y: 24 },
      { id: "b", x: 280, y: 24 },
      { id: "c", x: 24, y: 200 },
    ]);
  });

  it("preserves the supplied card order", () => {
    expect(tidyCardLayout([
      { id: "newest", width: 300, height: 100 },
      { id: "oldest", width: 300, height: 100 },
    ], 340).map((card) => card.id)).toEqual(["newest", "oldest"]);
  });
});
