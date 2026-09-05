import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { logs } from "@/server/db/schema";
import { createLog, setTaskDone, updateLog } from "@/server/domain/log";
import { createUser } from "@/server/domain/user";
import { createPersonalWorkspace } from "@/server/domain/workspace";
import { createTestDb } from "../helpers/test-db";
import { MemoryStorage } from "../helpers/memory-storage";

async function fixture() {
  const db = createTestDb();
  const storage = new MemoryStorage();
  const user = await createUser(db, { email: "hakan@example.com", password: "password123", name: "Hakan", role: "admin" });
  const workspace = await createPersonalWorkspace(db, user);
  return { db, storage, user, workspace };
}

describe("Log write path", () => {
  it("creates derived tags and tasks and writes full mirror frontmatter", async () => {
    const { db, storage, user, workspace } = await fixture();
    const log = await createLog(db, storage, { workspaceId: workspace.id, authorId: user.id, day: "2026-09-04", title: "Postgres tuning", body: "Try #postgres\n- [ ] benchmark !tomorrow" });
    expect(log.tags).toEqual(["postgres"]);
    expect(log.tasks[0]).toMatchObject({ text: "benchmark", dueDate: "2026-09-05", lineNo: 2 });
    const key = [...storage.objects.keys()][0];
    expect(key).toMatch(/workspaces\/personal-hakan\/2026\/09\/04\/.+-postgres-tuning\.md$/);
    const source = new TextDecoder().decode(storage.objects.get(key)?.bytes);
    expect(source).toContain(`id: "${log.id}"`);
    expect(source).toContain('workspace: "personal-hakan"');
    expect(source).toContain("tags: [\"postgres\"]");
  });

  it("keeps the mirror key stable when title changes", async () => {
    const { db, storage, user, workspace } = await fixture();
    const log = await createLog(db, storage, { workspaceId: workspace.id, authorId: user.id, day: "2026-09-04", title: "First", body: "body" });
    const before = [...storage.objects.keys()][0];
    await updateLog(db, storage, log.id, { title: "Second" });
    expect([...storage.objects.keys()]).toEqual([before]);
  });

  it("keeps the DB save and marks dirty when mirror storage fails", async () => {
    const { db, storage, user, workspace } = await fixture();
    storage.failWrites = true;
    const log = await createLog(db, storage, { workspaceId: workspace.id, authorId: user.id, day: "2026-09-04", body: "still saved" });
    const row = (await db.select().from(logs).where(eq(logs.id, log.id)))[0];
    expect(row.body).toBe("still saved");
    expect(row.mirrorDirty).toBe(true);
  });

  it("rewrites the exact checkbox line", async () => {
    const { db, storage, user, workspace } = await fixture();
    const log = await createLog(db, storage, { workspaceId: workspace.id, authorId: user.id, day: "2026-09-04", body: "intro\n  - [ ] ship\nend" });
    const updated = await setTaskDone(db, storage, log.tasks[0].id, true, workspace.id);
    expect(updated.body).toBe("intro\n  - [x] ship\nend");
  });
});
