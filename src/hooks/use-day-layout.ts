"use client";
import { useState } from "react";

export function useDayLayout() {
  const [layout, setLayout] = useState<"canvas" | "masonry">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("loggo:day-layout");
      if (saved === "canvas" || saved === "masonry") {
        return saved;
      }
    }
    return "masonry";
  });

  const saveLayout = (val: "canvas" | "masonry") => {
    setLayout(val);
    try {
      localStorage.setItem("loggo:day-layout", val);
    } catch {}
  };

  return [layout, saveLayout] as const;
}
