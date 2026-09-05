import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { workspaces } from "@/server/db/schema";
import { createUser } from "@/server/domain/user";
import { createWorkspace, updateWorkspace } from "@/server/domain/workspace";
import { createTestDb } from "../helpers/test-db";

describe("Workspace appearance", () => {
  it("stores a selected color and icon when creating a Workspace", async () => {
    const db = createTestDb();
    const owner = await createUser(db, { email: "owner@example.com", password: "password123", name: "Owner", role: "admin" });
    const workspace = await createWorkspace(db, { name: "Engineering", kind: "shared", createdBy: owner.id, color: "bg-violet-500", icon: "code" });

    expect(workspace).toMatchObject({ name: "Engineering", color: "bg-violet-500", icon: "code" });
  });

  it("updates the name, color, and icon without changing the slug", async () => {
    const db = createTestDb();
    const owner = await createUser(db, { email: "owner@example.com", password: "password123", name: "Owner", role: "admin" });
    const workspace = await createWorkspace(db, { name: "Engineering", kind: "shared", createdBy: owner.id });

    await updateWorkspace(db, workspace.id, { name: "Platform", color: "bg-emerald-500", icon: "server" });
    const stored = (await db.select().from(workspaces).where(eq(workspaces.id, workspace.id)).limit(1))[0];

    expect(stored).toMatchObject({ name: "Platform", slug: "engineering", color: "bg-emerald-500", icon: "server" });
  });
});
