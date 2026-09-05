export type LogShape = "task" | "snippet" | "attachment" | "text";

const taskLine = /^[-*+]\s+\[[ xX]\]\s+/;
const fenceLine = /^```/;
const soleAttachment = /^!\[[^\]]*\]\([^)]+\)$/;

export function classifyLog(body: string): LogShape {
  const trimmed = body.trim();
  if (!trimmed) return "text";

  const lines = trimmed.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length > 0 && lines.every((line) => taskLine.test(line))) return "task";

  if (fenceLine.test(trimmed)) {
    const firstLineEnd = trimmed.indexOf("\n");
    const closing = firstLineEnd === -1 ? -1 : trimmed.indexOf("```", firstLineEnd + 1);
    if (closing !== -1 && trimmed.slice(closing).trim() === "```") return "snippet";
  }

  if (soleAttachment.test(trimmed)) return "attachment";

  return "text";
}

export function extractSnippet(body: string): { language?: string; code: string } | null {
  const trimmed = body.trim();
  const opening = trimmed.match(/^```(\S*)\n/);
  if (!opening || !trimmed.endsWith("```")) return null;
  const code = trimmed.slice(opening[0].length, -3).replace(/\n$/, "");
  return { language: opening[1] || undefined, code };
}
