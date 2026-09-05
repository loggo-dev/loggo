import { describe, expect, it } from "vitest";
import { findUserByEmail, createUser, updateUser } from "@/server/domain/user";
import { verifyPassword } from "@/server/domain/password";
import { createTestDb } from "../helpers/test-db";

describe("User accounts", () => {
  it("stores the chosen avatar color and hashes the creation password", async () => {
    const db = createTestDb();
    const created = await createUser(db, { email: "balint@example.com", password: "balint@example.com", name: "Balint", role: "user", color: "bg-emerald-500" });
    const stored = await findUserByEmail(db, created.email);

    expect(created.color).toBe("bg-emerald-500");
    expect(stored?.passwordHash).not.toBe("balint@example.com");
    expect(await verifyPassword("balint@example.com", stored?.passwordHash ?? "")).toBe(true);
  });

  it("updates a password without changing the other User fields", async () => {
    const db = createTestDb();
    const created = await createUser(db, { email: "user@example.com", password: "old-password", name: "User", role: "user" });
    await updateUser(db, created.id, { password: "new-password" });
    const stored = await findUserByEmail(db, created.email);

    expect(await verifyPassword("old-password", stored?.passwordHash ?? "")).toBe(false);
    expect(await verifyPassword("new-password", stored?.passwordHash ?? "")).toBe(true);
    expect(stored).toMatchObject({ name: "User", role: "user", color: "bg-blue-500" });
  });
});
