import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appliedTemplates, attachments, logTags, logs, tags, tasks, templates, workspaceMembers, workspaces } from "@/server/db/schema";
import { createAttachment } from "@/server/domain/attachment";
import { createLog } from "@/server/domain/log";
import { createTemplate } from "@/server/domain/templates";
import { createUser, deleteUser } from "@/server/domain/user";
import { createWorkspace, deleteWorkspace } from "@/server/domain/workspace";
import { createTestDb } from "../helpers/test-db";
import { MemoryStorage } from "../helpers/memory-storage";

async function fixture() {
  const db = createTestDb();
  const storage = new MemoryStorage();
  const owner = await createUser(db, { email: "owner@example.com", password: "password123", name: "Owner", role: "admin" });
  const member = await createUser(db, { email: "member@example.com", password: "password123", name: "Member", role: "user" });
  const workspace = await createWorkspace(db, { name: "Platform", kind: "shared", createdBy: owner.id, members: [member.id] });
  const log = await createLog(db, storage, { workspaceId: workspace.id, authorId: owner.id, day: "2026-09-04", body: "Try #postgres\n- [ ] benchmark !tomorrow" });
  await createAttachment(db, storage, { logId: log.id, workspaceId: workspace.id, filename: "graph.png", mime: "image/png", bytes: new Uint8Array([1, 2, 3]), maxSize: 1024, allowedTypes: ["image/png"] });
  await createTemplate(db, storage, workspace.id, { title: "Standup", body: "- [ ] standup" });
  await db.insert(appliedTemplates).values({ workspaceId: workspace.id, day: "2026-09-04" });
  return { db, storage, owner, member, workspace };
}

async function rowCounts(db: ReturnType<typeof createTestDb>, workspaceId: string) {
  return {
    workspace: (await db.select().from(workspaces).where(eq(workspaces.id, workspaceId))).length,
    members: (await db.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId))).length,
    logs: (await db.select().from(logs).where(eq(logs.workspaceId, workspaceId))).length,
    tags: (await db.select().from(tags).where(eq(tags.workspaceId, workspaceId))).length,
    tasks: (await db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId))).length,
    attachments: (await db.select().from(attachments).where(eq(attachments.workspaceId, workspaceId))).length,
    templates: (await db.select().from(templates).where(eq(templates.workspaceId, workspaceId))).length,
    appliedTemplates: (await db.select().from(appliedTemplates).where(eq(appliedTemplates.workspaceId, workspaceId))).length,
  };
}

describe("Cascade deletes", () => {
  it("deleteWorkspace wipes every child row and the workspace's storage files", async () => {
    const { db, storage, workspace } = await fixture();
    const before = await rowCounts(db, workspace.id);
    expect(before).toEqual({ workspace: 1, members: 2, logs: 1, tags: 1, tasks: 1, attachments: 1, templates: 1, appliedTemplates: 1 });
    expect(storage.objects.size).toBeGreaterThan(0);

    await deleteWorkspace(db, storage, workspace.id);

    const after = await rowCounts(db, workspace.id);
    expect(after).toEqual({ workspace: 0, members: 0, logs: 0, tags: 0, tasks: 0, attachments: 0, templates: 0, appliedTemplates: 0 });
    expect([...storage.objects.keys()].some((key) => key.startsWith(`workspaces/${workspace.slug}/`))).toBe(false);
  });

  it("deleteWorkspace also removes the log's tag/log_tag join rows, not just the tag itself", async () => {
    const { db, storage, workspace } = await fixture();
    const [log] = await db.select({ id: logs.id }).from(logs).where(eq(logs.workspaceId, workspace.id));
    const before = await db.select().from(logTags).where(eq(logTags.logId, log.id));
    expect(before.length).toBe(1);

    await deleteWorkspace(db, storage, workspace.id);

    const after = await db.select().from(logTags).where(eq(logTags.logId, log.id));
    expect(after.length).toBe(0);
  });

  it("deleteUser cascades through every workspace it created", async () => {
    const { db, storage, owner, workspace } = await fixture();

    await deleteUser(db, storage, owner.id);

    const remainingWorkspace = await db.select().from(workspaces).where(eq(workspaces.id, workspace.id));
    const remainingLogs = await db.select().from(logs).where(eq(logs.workspaceId, workspace.id));
    expect(remainingWorkspace).toHaveLength(0);
    expect(remainingLogs).toHaveLength(0);
  });
});
