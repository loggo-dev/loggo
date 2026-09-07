import { and, asc, eq, inArray, isNull, sql, gte, lte } from "drizzle-orm";
import { ulid } from "ulid";
import { attachments, logTags, logs, tags, tasks, users, workspaces } from "../db/schema";
import type { AppDb } from "../db/types";
import { ConflictError, NotFoundError, ValidationError } from "./errors";
import { parseMarkdown } from "./parse-markdown";
import type { Storage } from "./storage";
import { deleteLogMirror, existingMirrorKey, writeLogMirror } from "./mirror";
import { activeLogWhere } from "./active-log";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function syncDerivedData(db: AppDb, log: { id: string; workspaceId: string; body: string; day: string }) {
  const parsed = parseMarkdown(log.body, log.day);
  await db.delete(logTags).where(eq(logTags.logId, log.id));
  await db.delete(tasks).where(eq(tasks.logId, log.id));

  for (const name of parsed.tags) {
    let tag = (await db.select().from(tags).where(and(eq(tags.workspaceId, log.workspaceId), eq(tags.name, name))).limit(1))[0];
    if (!tag) {
      tag = { id: ulid(), workspaceId: log.workspaceId, name };
      await db.insert(tags).values(tag);
    }
    await db.insert(logTags).values({ logId: log.id, tagId: tag.id });
  }

  if (parsed.tasks.length) {
    await db.insert(tasks).values(parsed.tasks.map((task) => ({
      id: ulid(), logId: log.id, workspaceId: log.workspaceId, text: task.text,
      done: task.done, dueDate: task.dueDate, lineNo: task.lineNo,
      completedAt: task.done ? new Date().toISOString() : null,
    })));
  }
  await db.run(sql`UPDATE logs_fts SET tag_names = ${parsed.tags.join(" ")} WHERE log_id = ${log.id}`);
  return parsed;
}

export async function createLog(db: AppDb, storage: Storage | null, params: { workspaceId: string; authorId: string; day: string; title?: string | null; body: string; posX?: number | null; posY?: number | null }) {
  if (!DAY_PATTERN.test(params.day) || Number.isNaN(Date.parse(`${params.day}T00:00:00Z`))) throw new ValidationError("Day must be a valid YYYY-MM-DD date");
  const now = new Date().toISOString();
  const log = { id: ulid(), workspaceId: params.workspaceId, authorId: params.authorId, day: params.day, title: params.title?.trim() || null, body: params.body, createdAt: now, updatedAt: now, deletedAt: null, mirrorDirty: false, posX: params.posX ?? null, posY: params.posY ?? null, isLocked: false };
  await db.atomic(async (tx) => {
    await tx.insert(logs).values(log);
    await syncDerivedData(tx as unknown as AppDb, log);
  });
  if (storage) await writeLogMirror(db, storage, log.id);
  return getLog(db, log.id);
}

export async function updateLog(db: AppDb, storage: Storage | null, id: string, params: { title?: string | null; body?: string; isLocked?: boolean }, workspaceId?: string) {
  const current = (await db.select().from(logs).where(activeLogWhere(eq(logs.id, id), workspaceId ? eq(logs.workspaceId, workspaceId) : undefined)).limit(1))[0];
  if (!current) throw new NotFoundError("Log not found");
  const next = { ...current, ...(params.title !== undefined ? { title: params.title?.trim() || null } : {}), ...(params.body !== undefined ? { body: params.body } : {}), ...(params.isLocked !== undefined ? { isLocked: params.isLocked } : {}), updatedAt: new Date().toISOString() };
  await db.atomic(async (tx) => {
    await tx.update(logs).set({ title: next.title, body: next.body, isLocked: next.isLocked, updatedAt: next.updatedAt }).where(eq(logs.id, id));
    await syncDerivedData(tx as unknown as AppDb, next);
  });
  if (storage) await writeLogMirror(db, storage, id);
  return getLog(db, id, workspaceId);
}

// Position is board-arrangement state, not content: it skips the mirror
// writer and `updatedAt` entirely so dragging a card never triggers a
// markdown rewrite.
export async function setLogPosition(db: AppDb, id: string, workspaceId: string, posX: number, posY: number) {
  const current = (await db.select({ id: logs.id }).from(logs).where(activeLogWhere(eq(logs.id, id), eq(logs.workspaceId, workspaceId))).limit(1))[0];
  if (!current) throw new NotFoundError("Log not found");
  await db.update(logs).set({ posX, posY }).where(eq(logs.id, id));
}

export async function setLogSize(db: AppDb, id: string, workspaceId: string, width: number, height: number) {
  const current = (await db.select({ id: logs.id }).from(logs).where(activeLogWhere(eq(logs.id, id), eq(logs.workspaceId, workspaceId))).limit(1))[0];
  if (!current) throw new NotFoundError("Log not found");
  await db.update(logs).set({ width, height }).where(eq(logs.id, id));
}

// Stacking order is board-arrangement state, same as position - it skips the
// mirror writer and `updatedAt` so bringing a card to front never triggers a
// markdown rewrite.
export async function setLogZIndex(db: AppDb, id: string, workspaceId: string, zIndex: number) {
  const current = (await db.select({ id: logs.id }).from(logs).where(activeLogWhere(eq(logs.id, id), eq(logs.workspaceId, workspaceId))).limit(1))[0];
  if (!current) throw new NotFoundError("Log not found");
  await db.update(logs).set({ zIndex }).where(eq(logs.id, id));
}

export async function duplicateLog(db: AppDb, storage: Storage | null, id: string, workspaceId: string, authorId: string) {
  const current = (await db.select().from(logs).where(activeLogWhere(eq(logs.id, id), eq(logs.workspaceId, workspaceId))).limit(1))[0];
  if (!current) throw new NotFoundError("Log not found");
  const [{ maxZ } = { maxZ: 0 }] = await db.select({ maxZ: sql<number>`max(${logs.zIndex})` }).from(logs).where(activeLogWhere(eq(logs.workspaceId, workspaceId), eq(logs.day, current.day)));
  const now = new Date().toISOString();
  const log = {
    id: ulid(), workspaceId, authorId, day: current.day, title: current.title, body: current.body,
    createdAt: now, updatedAt: now, deletedAt: null, mirrorDirty: false,
    posX: current.posX != null ? current.posX + 24 : null,
    posY: current.posY != null ? current.posY + 24 : null,
    width: current.width, height: current.height,
    zIndex: (maxZ ?? 0) + 1,
    isLocked: current.isLocked,
  };
  await db.atomic(async (tx) => {
    await tx.insert(logs).values(log);
    await syncDerivedData(tx as unknown as AppDb, log);
  });
  if (storage) await writeLogMirror(db, storage, log.id);
  return getLog(db, log.id);
}

export async function deleteLog(db: AppDb, storage: Storage | null, id: string, workspaceId?: string) {
  const current = (await db.select().from(logs).where(activeLogWhere(eq(logs.id, id), workspaceId ? eq(logs.workspaceId, workspaceId) : undefined)).limit(1))[0];
  if (!current) throw new NotFoundError("Log not found");
  await db.update(logs).set({ deletedAt: new Date().toISOString(), mirrorDirty: true }).where(eq(logs.id, id));
  if (storage) await deleteLogMirror(db, storage, id);
}

export async function getLog(db: AppDb, id: string, workspaceId?: string) {
  const row = (await db.select({ log: logs, author: { id: users.id, name: users.name }, workspace: { id: workspaces.id, slug: workspaces.slug, name: workspaces.name } })
    .from(logs).innerJoin(users, eq(logs.authorId, users.id)).innerJoin(workspaces, eq(logs.workspaceId, workspaces.id))
    .where(activeLogWhere(eq(logs.id, id), workspaceId ? eq(logs.workspaceId, workspaceId) : undefined)).limit(1))[0];
  if (!row) throw new NotFoundError("Log not found");
  const tagRows = await db.select({ name: tags.name }).from(logTags).innerJoin(tags, eq(logTags.tagId, tags.id)).where(eq(logTags.logId, id));
  const taskRows = await db.select().from(tasks).where(eq(tasks.logId, id));
  return { ...row.log, author: row.author, workspace: row.workspace, tags: tagRows.map((tag) => tag.name), tasks: taskRows };
}

export async function listLogs(db: AppDb, workspaceId: string, filters: { day?: string; from?: string; to?: string; tag?: string; limit?: number; offset?: number } = {}) {
  const conditions = [
    eq(logs.workspaceId, workspaceId),
    filters.day ? eq(logs.day, filters.day) : undefined,
    filters.from ? gte(logs.day, filters.from) : undefined,
    filters.to ? lte(logs.day, filters.to) : undefined
  ];
  const base = db.select({ log: logs, authorName: users.name }).from(logs).innerJoin(users, eq(logs.authorId, users.id));
  const rows = filters.tag
    ? await base.innerJoin(logTags, eq(logTags.logId, logs.id)).innerJoin(tags, eq(tags.id, logTags.tagId)).where(activeLogWhere(...conditions, eq(tags.name, filters.tag))).orderBy(asc(logs.createdAt)).limit(filters.limit ?? 100).offset(filters.offset ?? 0)
    : await base.where(activeLogWhere(...conditions)).orderBy(asc(logs.createdAt)).limit(filters.limit ?? 100).offset(filters.offset ?? 0);
  const ids = rows.map((row) => row.log.id);
  const allTags = ids.length ? await db.select({ logId: logTags.logId, name: tags.name }).from(logTags).innerJoin(tags, eq(tags.id, logTags.tagId)).where(inArray(logTags.logId, ids)) : [];
  return rows.map((row) => ({ ...row.log, authorName: row.authorName, tags: allTags.filter((tag) => tag.logId === row.log.id).map((tag) => tag.name) }));
}

export async function restoreLog(db: AppDb, input: { id: string; workspaceId: string; authorId: string; day: string; title: string | null; body: string; createdAt: string; updatedAt: string; posX?: number; posY?: number; width?: number; height?: number; zIndex?: number; isLocked?: boolean }) {
  await db.insert(logs).values({ ...input, zIndex: input.zIndex ?? 0, isLocked: input.isLocked ?? false, deletedAt: null, mirrorDirty: false });
  await syncDerivedData(db, { id: input.id, workspaceId: input.workspaceId, body: input.body, day: input.day });
}

export async function moveLog(db: AppDb, storage: Storage | null, id: string, sourceWorkspaceId: string, targetWorkspaceId: string) {
  const current = (await db.select({ log: logs, sourceSlug: workspaces.slug }).from(logs).innerJoin(workspaces, eq(logs.workspaceId, workspaces.id)).where(activeLogWhere(eq(logs.id, id), eq(logs.workspaceId, sourceWorkspaceId))).limit(1))[0];
  if (!current) throw new NotFoundError("Log not found");
  if (sourceWorkspaceId === targetWorkspaceId) return getLog(db, id, sourceWorkspaceId);
  const target = (await db.select().from(workspaces).where(eq(workspaces.id, targetWorkspaceId)).limit(1))[0];
  if (!target) throw new NotFoundError("Target workspace not found");
  const oldKey = storage ? await existingMirrorKey(storage, current.sourceSlug, current.log.day, id) : null;
  await db.atomic(async (tx) => {
    await tx.update(logs).set({ workspaceId: targetWorkspaceId, updatedAt: new Date().toISOString(), mirrorDirty: true }).where(eq(logs.id, id));
    await tx.update(attachments).set({ workspaceId: targetWorkspaceId }).where(eq(attachments.logId, id));
    await syncDerivedData(tx, { ...current.log, workspaceId: targetWorkspaceId });
  });
  if (storage) {
    if (oldKey) { try { await storage.delete(oldKey); } catch { /* the new mirror still remains retryable */ } }
    await writeLogMirror(db, storage, id);
  }
  return getLog(db, id, targetWorkspaceId);
}

export async function setTaskDone(db: AppDb, storage: Storage | null, taskId: string, done: boolean, workspaceId?: string) {
  const row = (await db.select({ task: tasks, log: logs }).from(tasks).innerJoin(logs, eq(tasks.logId, logs.id)).where(and(eq(tasks.id, taskId), isNull(logs.deletedAt), workspaceId ? eq(tasks.workspaceId, workspaceId) : undefined)).limit(1))[0];
  if (!row) throw new NotFoundError("Task not found");
  const lines = row.log.body.split(/\r?\n/);
  const lineIndex = row.task.lineNo - 1;
  if (!lines[lineIndex]?.match(/^\s*[-*+]\s+\[[ xX]\]/)) throw new ConflictError("The task line changed. Save the Log and try again.");
  lines[lineIndex] = lines[lineIndex].replace(/^(\s*[-*+]\s+)\[[ xX]\]/, `$1[${done ? "x" : " "}]`);
  return updateLog(db, storage, row.log.id, { body: lines.join("\n") }, workspaceId);
}
