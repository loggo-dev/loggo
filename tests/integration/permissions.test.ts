import { describe, expect, it } from "vitest";
import { createApp } from "@/server/app";
import { createLog } from "@/server/domain/log";
import { createSession } from "@/server/domain/session";
import { createUser } from "@/server/domain/user";
import { createPersonalWorkspace } from "@/server/domain/workspace";
import { createTestDb } from "../helpers/test-db";
import { MemoryStorage } from "../helpers/memory-storage";

describe("workspace permissions", () => {
  it("never lets a user read another workspace", async () => {
    const db = createTestDb();
    const storage = new MemoryStorage();
    const first = await createUser(db, { email: "first@example.com", password: "password123", name: "First", role: "user" });
    const second = await createUser(db, { email: "second@example.com", password: "password123", name: "Second", role: "user" });
    const firstWorkspace = await createPersonalWorkspace(db, first);
    const secondWorkspace = await createPersonalWorkspace(db, second);
    const privateLog = await createLog(db, storage, { workspaceId: firstWorkspace.id, authorId: first.id, day: "2026-09-04", body: "private" });
    const session = await createSession(db, second.id);
    const app = createApp({ db, storage, readOnly: false, maxAttachmentSize: 1000, allowedFileTypes: ["text/plain"] });

    const direct = await app.request(`/api/workspaces/${firstWorkspace.id}/logs/${privateLog.id}`, { headers: { cookie: `loggo_session=${session.id}` } });
    expect(direct.status).toBe(403);

    const disguised = await app.request(`/api/workspaces/${secondWorkspace.id}/logs/${privateLog.id}`, { headers: { cookie: `loggo_session=${session.id}` } });
    expect(disguised.status).toBe(404);
  });

  it("rejects all workspace mutations in read-only mode", async () => {
    const db = createTestDb();
    const user = await createUser(db, { email: "demo@example.com", password: "password123", name: "Demo", role: "user" });
    const workspace = await createPersonalWorkspace(db, user);
    const session = await createSession(db, user.id);
    const app = createApp({ db, storage: null, readOnly: true, maxAttachmentSize: 1000, allowedFileTypes: [] });
    const response = await app.request(`/api/workspaces/${workspace.id}/logs`, { method: "POST", headers: { cookie: `loggo_session=${session.id}`, "content-type": "application/json" }, body: JSON.stringify({ day: "2026-09-04", body: "no" }) });
    expect(response.status).toBe(403);
  });
});
