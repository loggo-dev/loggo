import { eq } from "drizzle-orm";
import { logTags, logs, tags, users, workspaces } from "../db/schema";
import type { AppDb } from "../db/types";
import { slugify } from "./slug";
import type { Storage } from "./storage";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function directoryFor(workspaceSlug: string, day: string) {
  const [year, month, date] = day.split("-");
  return `workspaces/${workspaceSlug}/${year}/${month}/${date}`;
}

function yamlValue(value: string | null) {
  return value === null ? "null" : JSON.stringify(value);
}

export async function mirrorRecord(db: AppDb, logId: string) {
  const row = (await db.select({ log: logs, authorName: users.name, workspaceSlug: workspaces.slug, workspaceName: workspaces.name, workspaceColor: workspaces.color, workspaceIcon: workspaces.icon })
    .from(logs).innerJoin(users, eq(logs.authorId, users.id)).innerJoin(workspaces, eq(logs.workspaceId, workspaces.id))
    .where(eq(logs.id, logId)).limit(1))[0];
  if (!row) return null;
  const tagRows = await db.select({ name: tags.name }).from(logTags).innerJoin(tags, eq(logTags.tagId, tags.id)).where(eq(logTags.logId, logId));
  return { ...row, tagNames: tagRows.map((tag) => tag.name) };
}

export async function existingMirrorKey(storage: Storage, workspaceSlug: string, day: string, id: string) {
  const directory = directoryFor(workspaceSlug, day);
  const match = (await storage.list(directory)).find((key) => key.slice(key.lastIndexOf("/") + 1).startsWith(`${id}-`) || key.endsWith(`/${id}.md`));
  return match ?? null;
}

export async function writeLogMirror(db: AppDb, storage: Storage, logId: string) {
  const record = await mirrorRecord(db, logId);
  if (!record) return;
  try {
    const key = await existingMirrorKey(storage, record.workspaceSlug, record.log.day, record.log.id)
      ?? `${directoryFor(record.workspaceSlug, record.log.day)}/${record.log.id}${record.log.title ? `-${slugify(record.log.title)}` : ""}.md`;
    const content = [
      "---",
      `id: ${yamlValue(record.log.id)}`,
      `title: ${yamlValue(record.log.title)}`,
      `day: ${yamlValue(record.log.day)}`,
      `created: ${yamlValue(record.log.createdAt)}`,
      `updated: ${yamlValue(record.log.updatedAt)}`,
      `author: ${yamlValue(record.authorName)}`,
      `workspace: ${yamlValue(record.workspaceSlug)}`,
      `workspace_name: ${yamlValue(record.workspaceName)}`,
      `workspace_color: ${yamlValue(record.workspaceColor)}`,
      `workspace_icon: ${yamlValue(record.workspaceIcon)}`,
      `tags: ${JSON.stringify(record.tagNames)}`,
      ...(record.log.posX != null ? [`pos_x: ${record.log.posX}`] : []),
      ...(record.log.posY != null ? [`pos_y: ${record.log.posY}`] : []),
      ...(record.log.width != null ? [`width: ${record.log.width}`] : []),
      ...(record.log.height != null ? [`height: ${record.log.height}`] : []),
      "---",
      "",
      record.log.body,
    ].join("\n");
    await storage.put(key, encoder.encode(content), "text/markdown; charset=utf-8");
    await db.update(logs).set({ mirrorDirty: false }).where(eq(logs.id, logId));
  } catch {
    await db.update(logs).set({ mirrorDirty: true }).where(eq(logs.id, logId));
  }
}

export async function deleteLogMirror(db: AppDb, storage: Storage, logId: string) {
  const record = await mirrorRecord(db, logId);
  if (!record) return;
  try {
    const key = await existingMirrorKey(storage, record.workspaceSlug, record.log.day, logId);
    if (key) await storage.delete(key);
    await db.update(logs).set({ mirrorDirty: false }).where(eq(logs.id, logId));
  } catch {
    await db.update(logs).set({ mirrorDirty: true }).where(eq(logs.id, logId));
  }
}

export async function retryDirtyMirrors(db: AppDb, storage: Storage) {
  const dirty = await db.select({ id: logs.id, deletedAt: logs.deletedAt }).from(logs).where(eq(logs.mirrorDirty, true));
  for (const log of dirty) {
    if (log.deletedAt) await deleteLogMirror(db, storage, log.id);
    else await writeLogMirror(db, storage, log.id);
  }
  return dirty.length;
}

export type MirrorFrontmatter = { id: string; title: string | null; day: string; created: string; updated: string; author: string; workspace: string; workspace_name?: string; workspace_color?: string; workspace_icon?: string; tags: string[]; pos_x?: number; pos_y?: number; width?: number; height?: number };

export function parseMirrorFile(bytes: Uint8Array): { frontmatter: MirrorFrontmatter; body: string } {
  const source = decoder.decode(bytes).replace(/\r\n/g, "\n");
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("Mirror file has no frontmatter");
  const values = new Map<string, unknown>();
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    try { values.set(key, JSON.parse(raw)); } catch { values.set(key, raw); }
  }
  const required = ["id", "day", "created", "updated", "author", "workspace"];
  if (required.some((key) => typeof values.get(key) !== "string")) throw new Error("Mirror file is missing required frontmatter");
  return { frontmatter: Object.fromEntries(values) as MirrorFrontmatter, body: match[2].replace(/^\n/, "") };
}
