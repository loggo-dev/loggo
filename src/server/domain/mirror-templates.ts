import { eq } from "drizzle-orm";
import { templates, workspaces } from "../db/schema";
import type { AppDb } from "../db/types";
import { slugify } from "./slug";
import type { Storage } from "./storage";

const encoder = new TextEncoder();

function directoryFor(workspaceSlug: string) {
  return `workspaces/${workspaceSlug}/_templates`;
}

function yamlValue(value: string | null | boolean) {
  return value === null ? "null" : JSON.stringify(value);
}

export async function writeTemplateMirror(db: AppDb, storage: Storage, templateId: string) {
  const row = (await db.select({ template: templates, workspaceSlug: workspaces.slug })
    .from(templates).innerJoin(workspaces, eq(templates.workspaceId, workspaces.id))
    .where(eq(templates.id, templateId)).limit(1))[0];
  if (!row) return;

  try {
    const key = `${directoryFor(row.workspaceSlug)}/${row.template.id}${row.template.title ? `-${slugify(row.template.title)}` : ""}.md`;
    const content = [
      "---",
      `id: ${yamlValue(row.template.id)}`,
      `title: ${yamlValue(row.template.title)}`,
      `enabled: ${yamlValue(row.template.enabled)}`,
      `created: ${yamlValue(row.template.createdAt)}`,
      `workspace: ${yamlValue(row.workspaceSlug)}`,
      "---",
      "",
      row.template.body,
    ].join("\n");
    await storage.put(key, encoder.encode(content), "text/markdown; charset=utf-8");
    await db.update(templates).set({ mirrorDirty: false }).where(eq(templates.id, templateId));
  } catch {
    await db.update(templates).set({ mirrorDirty: true }).where(eq(templates.id, templateId));
  }
}

export async function deleteTemplateMirror(db: AppDb, storage: Storage, templateId: string) {
  const row = (await db.select({ template: templates, workspaceSlug: workspaces.slug })
    .from(templates).innerJoin(workspaces, eq(templates.workspaceId, workspaces.id))
    .where(eq(templates.id, templateId)).limit(1))[0];
  if (!row) return;

  try {
    const directory = directoryFor(row.workspaceSlug);
    const keys = await storage.list(directory);
    const key = keys.find((k) => k.slice(k.lastIndexOf("/") + 1).startsWith(`${templateId}-`) || k.endsWith(`/${templateId}.md`));
    if (key) await storage.delete(key);
    // If it's deleted, we don't update mirrorDirty because the row is gone.
  } catch {
    // If it fails, maybe log it, but the template row is already deleted in the DB.
    // In a perfectly robust system, soft-deletes would be used. But this is fine for v1.
  }
}
