import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";
import { workspaceMembers, workspaces } from "../db/schema";
import type { AppDb } from "../db/types";
import { ConflictError, ForbiddenError, NotFoundError } from "./errors";
import { slugify } from "./slug";
import { DEFAULT_WORKSPACE_COLOR, DEFAULT_WORKSPACE_ICON, type WorkspaceColor, type WorkspaceIconName } from "@/lib/workspace-appearance";

export async function uniqueWorkspaceSlug(db: AppDb, requested: string) {
  const base = slugify(requested);
  let slug = base;
  for (let suffix = 2; await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, slug)).limit(1).then((rows) => rows.length > 0); suffix += 1) {
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function createWorkspace(db: AppDb, params: { name: string; kind: "personal" | "shared"; createdBy: string; members?: string[]; slug?: string; color?: WorkspaceColor; icon?: WorkspaceIconName }) {
  const workspace = { id: ulid(), slug: await uniqueWorkspaceSlug(db, params.slug ?? params.name), name: params.name.trim(), color: params.color ?? DEFAULT_WORKSPACE_COLOR, icon: params.icon ?? DEFAULT_WORKSPACE_ICON, kind: params.kind, createdBy: params.createdBy };
  await db.atomic(async (tx) => {
    await tx.insert(workspaces).values(workspace);
    const memberIds = Array.from(new Set([params.createdBy, ...(params.members ?? [])]));
    if (params.kind === "personal" && memberIds.length !== 1) throw new ConflictError("Personal workspaces can only have one member");
    await tx.insert(workspaceMembers).values(memberIds.map((userId) => ({ workspaceId: workspace.id, userId, role: userId === params.createdBy ? "owner" as const : "member" as const })));
  });
  return workspace;
}

export async function createPersonalWorkspace(db: AppDb, user: { id: string; name: string }) {
  return createWorkspace(db, { name: "Personal", slug: `personal-${slugify(user.name)}`, kind: "personal", createdBy: user.id });
}

export async function listUserWorkspaces(db: AppDb, userId: string) {
  return db.select({ id: workspaces.id, slug: workspaces.slug, name: workspaces.name, color: workspaces.color, icon: workspaces.icon, kind: workspaces.kind, templateMode: workspaces.templateMode, role: workspaceMembers.role })
    .from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(eq(workspaceMembers.userId, userId));
}

export async function updateWorkspace(db: AppDb, workspaceId: string, values: { name: string; color: WorkspaceColor; icon: WorkspaceIconName }) {
  const workspace = (await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1))[0];
  if (!workspace) throw new NotFoundError("Workspace not found");
  await db.update(workspaces).set({ name: values.name.trim(), color: values.color, icon: values.icon }).where(eq(workspaces.id, workspaceId));
}

export async function requireWorkspaceMember(db: AppDb, userId: string, workspaceIdOrSlug: string) {
  const row = (await db.select({ workspace: workspaces, role: workspaceMembers.role })
    .from(workspaces).innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.userId, userId), workspaceIdOrSlug.includes("-") ? eq(workspaces.slug, workspaceIdOrSlug) : eq(workspaces.id, workspaceIdOrSlug))).limit(1))[0];
  if (!row) throw new ForbiddenError("You are not a member of this workspace");
  return row;
}

export async function setWorkspaceMembers(db: AppDb, workspaceId: string, userIds: string[]) {
  const workspace = (await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1))[0];
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.kind === "personal") throw new ConflictError("Personal workspace membership cannot change");
  const members = Array.from(new Set([workspace.createdBy, ...userIds]));
  await db.atomic(async (tx) => {
    await tx.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
    await tx.insert(workspaceMembers).values(members.map((userId) => ({ workspaceId, userId, role: userId === workspace.createdBy ? "owner" as const : "member" as const })));
  });
}

export async function deleteWorkspace(db: AppDb, storage: import("./storage").Storage | null, workspaceId: string) {
  const workspace = (await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1))[0];
  if (!workspace) throw new NotFoundError("Workspace not found");

  if (storage) {
    const files = await storage.list(`workspaces/${workspace.slug}/`);
    for (const file of files) {
      await storage.delete(file);
    }
  }

  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
}
