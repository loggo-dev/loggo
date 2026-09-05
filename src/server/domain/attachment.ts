import { and, desc, eq, isNull, gte, lte, like } from "drizzle-orm";
import { ulid } from "ulid";
import { attachments, logs, workspaces } from "../db/schema";
import type { AppDb } from "../db/types";
import { NotFoundError, ValidationError } from "./errors";
import type { Storage } from "./storage";

function safeFilename(filename: string) {
  const name = filename.split(/[\\/]/).pop()?.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "");
  return name || "attachment";
}

export async function createAttachment(db: AppDb, storage: Storage, input: { logId: string; workspaceId: string; filename: string; mime: string; bytes: Uint8Array; maxSize: number; allowedTypes: string[] }) {
  if (input.bytes.byteLength > input.maxSize) throw new ValidationError("Attachment is too large");
  if (!input.allowedTypes.includes("*/*") && !input.allowedTypes.includes("*") && !input.allowedTypes.includes(input.mime)) throw new ValidationError("This file type is not allowed");
  const row = (await db.select({ log: logs, workspaceSlug: workspaces.slug }).from(logs).innerJoin(workspaces, eq(logs.workspaceId, workspaces.id))
    .where(and(eq(logs.id, input.logId), eq(logs.workspaceId, input.workspaceId), isNull(logs.deletedAt))).limit(1))[0];
  if (!row) throw new NotFoundError("Log not found");
  const id = ulid();
  const filename = `${id}-${safeFilename(input.filename)}`;
  const [year, month, day] = row.log.day.split("-");
  const storageKey = `workspaces/${row.workspaceSlug}/${year}/${month}/${day}/_files/${filename}`;
  await storage.put(storageKey, input.bytes, input.mime);
  try {
    await db.insert(attachments).values({ id, logId: input.logId, workspaceId: input.workspaceId, filename, mime: input.mime, size: input.bytes.byteLength, storageKey });
  } catch (error) {
    await storage.delete(storageKey);
    throw error;
  }
  return { id, filename, relativeLink: `./_files/${filename}`, mime: input.mime, size: input.bytes.byteLength };
}

export async function listAttachments(db: AppDb, workspaceId: string, filters: { from?: string; to?: string; extension?: string; limit?: number; offset?: number } = {}) {
  const query = db.select({ attachment: attachments, logTitle: logs.title, day: logs.day }).from(attachments)
    .innerJoin(logs, eq(attachments.logId, logs.id))
    .where(and(
      eq(attachments.workspaceId, workspaceId),
      isNull(logs.deletedAt),
      filters.from ? gte(logs.day, filters.from) : undefined,
      filters.to ? lte(logs.day, filters.to) : undefined,
      // Filenames are stored as `<id>-<original name>`, so matching the
      // original extension is a suffix check rather than an indexed column.
      filters.extension ? like(attachments.filename, `%.${filters.extension}`) : undefined
    ))
    .orderBy(desc(attachments.createdAt));

  if (filters.limit) query.limit(filters.limit);
  if (filters.offset) query.offset(filters.offset);

  return query;
}

function extensionOf(filename: string) {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : null;
}

export async function listAttachmentExtensions(db: AppDb, workspaceId: string) {
  const rows = await db.select({ filename: attachments.filename }).from(attachments).where(eq(attachments.workspaceId, workspaceId));
  const extensions = new Set<string>();
  for (const row of rows) {
    const extension = extensionOf(row.filename);
    if (extension) extensions.add(extension);
  }
  return [...extensions].sort();
}

export async function getAttachment(db: AppDb, workspaceId: string, id: string) {
  const row = (await db.select().from(attachments).where(and(eq(attachments.id, id), eq(attachments.workspaceId, workspaceId))).limit(1))[0];
  if (!row) throw new NotFoundError("Attachment not found");
  return row;
}

export async function deleteAttachment(db: AppDb, storage: Storage, workspaceId: string, id: string) {
  const attachment = await getAttachment(db, workspaceId, id);
  await storage.delete(attachment.storageKey);
  await db.delete(attachments).where(eq(attachments.id, id));
}
