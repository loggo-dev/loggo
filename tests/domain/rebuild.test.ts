import { describe, expect, it } from "vitest";
import { createLog, listLogs } from "@/server/domain/log";
import { rebuildFromStorage } from "@/server/domain/rebuild";
import { createUser } from "@/server/domain/user";
import { createPersonalWorkspace } from "@/server/domain/workspace";
import { createTestDb } from "../helpers/test-db";
import { MemoryStorage } from "../helpers/memory-storage";

describe("mirror rebuild", () => {
  it("restores Logs, tags, and tasks into a fresh database", async () => {
    const sourceDb = createTestDb();
    const storage = new MemoryStorage();
    const user = await createUser(sourceDb, { email: "hakan@example.com", password: "password123", name: "Hakan", role: "admin" });
    const workspace = await createPersonalWorkspace(sourceDb, user);
    const original = await createLog(sourceDb, storage, { workspaceId: workspace.id, authorId: user.id, day: "2026-09-04", title: "Portable", body: "#backup\n- [ ] restore !tomorrow" });

    const freshDb = createTestDb();
    const result = await rebuildFromStorage(freshDb, storage);
    expect(result.restored).toBe(1);
    const restoredWorkspace = (await import("@/server/db/schema")).workspaces;
    const rows = await freshDb.select().from(restoredWorkspace);
    const restored = await listLogs(freshDb, rows[0].id);
    expect(restored[0]).toMatchObject({ id: original.id, day: original.day, title: original.title, body: original.body, tags: ["backup"] });
  });
});
