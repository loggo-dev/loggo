import { eq, and } from "drizzle-orm";
import { ulid } from "ulid";
import { appliedTemplates, templates, workspaces } from "../db/schema";
import type { AppDb } from "../db/types";
import type { Storage } from "./storage";
import { createLog } from "./log";
import { writeTemplateMirror, deleteTemplateMirror } from "./mirror-templates";

export async function listTemplates(db: AppDb, workspaceId: string) {
  return db.select().from(templates).where(eq(templates.workspaceId, workspaceId));
}

export async function createTemplate(db: AppDb, storage: Storage, workspaceId: string, input: { title?: string | null; body: string; enabled?: boolean }) {
  const id = ulid();
  const template = {
    id,
    workspaceId,
    title: input.title?.trim() || null,
    body: input.body,
    enabled: input.enabled ?? true,
    createdAt: new Date().toISOString(),
    mirrorDirty: false,
  };
  await db.insert(templates).values(template);
  await writeTemplateMirror(db, storage, id);
  return template;
}

export async function updateTemplate(db: AppDb, storage: Storage, workspaceId: string, id: string, input: { title?: string | null; body?: string; enabled?: boolean }) {
  const [existing] = await db.select().from(templates).where(and(eq(templates.id, id), eq(templates.workspaceId, workspaceId))).limit(1);
  if (!existing) throw new Error("Template not found");
  const update = {
    title: input.title !== undefined ? (input.title?.trim() || null) : existing.title,
    body: input.body ?? existing.body,
    enabled: input.enabled ?? existing.enabled,
    mirrorDirty: false,
  };
  await db.update(templates).set(update).where(eq(templates.id, id));
  await writeTemplateMirror(db, storage, id);
  return { ...existing, ...update };
}

export async function deleteTemplate(db: AppDb, storage: Storage, workspaceId: string, id: string) {
  const [existing] = await db.select().from(templates).where(and(eq(templates.id, id), eq(templates.workspaceId, workspaceId))).limit(1);
  if (!existing) throw new Error("Template not found");
  await db.delete(templates).where(eq(templates.id, id));
  await deleteTemplateMirror(db, storage, id);
}

export async function checkAndApplyTemplates(db: AppDb, storage: Storage, workspaceId: string, authorId: string, day: string) {
  const [workspace] = await db.select({ templateMode: workspaces.templateMode }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!workspace) return false;

  if (workspace.templateMode === "today_only") {
    // Note: To be safe with timezones, we could expect the client to pass a flag,
    // but the simplest robust way without changing API signatures is just checking UTC YYYY-MM-DD.
    // However, JS Date gives local date. Let's do local ISO string date part.
    // wait, `new Date().toISOString()` is UTC! So it will switch at 00:00 UTC.
    // Since the client sets the day string, we will compare it strictly to the current UTC date.
    // This is fine for a v1 implementation of daily templates.
    const today = new Date().toISOString().split("T")[0];
    if (day !== today) return false;
  }

  // Check if applied
  const [applied] = await db.select().from(appliedTemplates).where(and(eq(appliedTemplates.workspaceId, workspaceId), eq(appliedTemplates.day, day))).limit(1);
  if (applied) return false;

  // Mark applied first (to avoid race conditions)
  try {
    await db.insert(appliedTemplates).values({ workspaceId, day, appliedAt: new Date().toISOString() });
  } catch {
    // If it throws, it was likely already applied by a concurrent request
    return false;
  }

  const enabledTemplates = await db.select().from(templates).where(and(eq(templates.workspaceId, workspaceId), eq(templates.enabled, true)));
  
  if (enabledTemplates.length === 0) return true; // Marked as applied, but nothing to generate

  for (const t of enabledTemplates) {
    await createLog(db, storage, {
      workspaceId,
      authorId,
      day,
      title: t.title,
      body: t.body,
    });
  }
  
  return true;
}
