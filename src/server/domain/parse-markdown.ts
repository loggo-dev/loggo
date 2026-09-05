export type ParsedTask = { text: string; done: boolean; dueDate: string | null; lineNo: number };
export type ParsedMarkdown = { tags: string[]; tasks: ParsedTask[]; attachments: string[] };

const C_DIRECTIVES = new Set(["include", "define", "ifdef", "ifndef", "endif", "if", "else", "elif", "pragma", "error", "warning", "line", "undef"]);
const TAG_PATTERN = /(^|[^\p{L}\p{N}_])#([\p{L}\p{N}_-]+(?:\/[\p{L}\p{N}_-]+)*)/gu;
const TASK_PATTERN = /^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/;
const ATTACHMENT_PATTERN = /(?:!\[[^\]]*\]|\[[^\]]*\])\(<?\.\/_files\/([^)>\s]+)>?\)/g;

function addDays(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function resolveDueDate(token: string, day: string): string | null {
  const lower = token.toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower) && !Number.isNaN(Date.parse(`${lower}T00:00:00Z`))) return lower;
  if (lower === "today") return day;
  if (lower === "tomorrow") return addDays(day, 1);
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = weekdays.indexOf(lower);
  if (target < 0) return null;
  const current = new Date(`${day}T12:00:00Z`).getUTCDay();
  const distance = (target - current + 7) % 7 || 7;
  return addDays(day, distance);
}

function removeInlineCode(line: string): string {
  return line.replace(/(`+)([\s\S]*?)\1/g, (match) => " ".repeat(match.length));
}

export function parseMarkdown(markdown: string, day: string): ParsedMarkdown {
  const tags = new Set<string>();
  const tasks: ParsedTask[] = [];
  const attachments = new Set<string>();
  const lines = markdown.split(/\r?\n/);
  let fence: "`" | "~" | null = null;
  let fenceLength = 0;

  lines.forEach((rawLine, index) => {
    const marker = rawLine.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      const character = marker[1][0] as "`" | "~";
      if (!fence) { fence = character; fenceLength = marker[1].length; return; }
      if (fence === character && marker[1].length >= fenceLength) { fence = null; fenceLength = 0; }
      return;
    }
    if (fence) return;

    const line = removeInlineCode(rawLine);
    const taskMatch = line.match(TASK_PATTERN);
    if (taskMatch) {
      let text = taskMatch[2].trim();
      let dueDate: string | null = null;
      const dueMatch = text.match(/(?:^|\s)!([\p{L}\d-]+)\s*$/u);
      if (dueMatch) {
        const resolved = resolveDueDate(dueMatch[1], day);
        if (resolved) { dueDate = resolved; text = text.slice(0, dueMatch.index).trim(); }
      }
      tasks.push({ text, done: taskMatch[1].toLowerCase() === "x", dueDate, lineNo: index + 1 });
    }

    if (!/^\s*#(?:include|define|ifdef|ifndef|endif|if|else|elif|pragma|error|warning|line|undef)\b/.test(line)) {
      for (const match of line.matchAll(TAG_PATTERN)) {
        const name = match[2];
        if (/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(name)) continue;
        if (match.index === line.search(/\S/) && C_DIRECTIVES.has(name.toLowerCase())) continue;
        tags.add(name.toLocaleLowerCase());
      }
    }
    for (const match of line.matchAll(ATTACHMENT_PATTERN)) attachments.add(decodeURIComponent(match[1]));
  });

  return { tags: [...tags], tasks, attachments: [...attachments] };
}
