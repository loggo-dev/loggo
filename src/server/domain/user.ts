import { and, eq, isNull } from "drizzle-orm";
import { ulid } from "ulid";
import { users } from "../db/schema";
import type { AppDb } from "../db/types";
import { nextUserColor, type UserColor } from "@/lib/user-colors";
import { ConflictError, NotFoundError } from "./errors";
import { hashPassword } from "./password";

export async function anyUserExists(db: AppDb): Promise<boolean> {
  return (await db.select({ id: users.id }).from(users).limit(1)).length > 0;
}

export async function findUserByEmail(db: AppDb, email: string) {
  return (await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1))[0] ?? null;
}

export async function createUser(db: AppDb, params: { email: string; password: string; name: string; role: "admin" | "user"; color?: UserColor }) {
  const email = params.email.trim().toLowerCase();
  if (await findUserByEmail(db, email)) throw new ConflictError("Email already in use");
  const existingCount = (await db.select({ id: users.id }).from(users)).length;
  const user = { id: ulid(), email, passwordHash: await hashPassword(params.password), name: params.name.trim(), color: params.color ?? nextUserColor(existingCount), role: params.role };
  await db.insert(users).values(user);
  return { id: user.id, email, name: user.name, color: user.color, role: user.role };
}

export async function listUsers(db: AppDb) {
  return db.select({ id: users.id, email: users.email, name: users.name, color: users.color, role: users.role, disabledAt: users.disabledAt, createdAt: users.createdAt }).from(users);
}

export async function updateUser(db: AppDb, id: string, values: { name?: string; color?: UserColor; role?: "admin" | "user"; disabled?: boolean; password?: string }) {
  const current = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
  if (!current) throw new NotFoundError("User not found");
  await db.update(users).set({
    ...(values.name !== undefined ? { name: values.name.trim() } : {}),
    ...(values.color !== undefined ? { color: values.color } : {}),
    ...(values.role !== undefined ? { role: values.role } : {}),
    ...(values.disabled !== undefined ? { disabledAt: values.disabled ? new Date().toISOString() : null } : {}),
    ...(values.password ? { passwordHash: await hashPassword(values.password) } : {}),
  }).where(eq(users.id, id));
}

export async function activeUserById(db: AppDb, id: string) {
  return (await db.select().from(users).where(and(eq(users.id, id), isNull(users.disabledAt))).limit(1))[0] ?? null;
}

export async function deleteUser(db: AppDb, storage: import("./storage").Storage | null, id: string) {
  const current = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
  if (!current) throw new NotFoundError("User not found");

  const { deleteWorkspace } = await import("./workspace");
  const { workspaces } = await import("../db/schema");
  
  const userWorkspaces = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.createdBy, id));
  
  for (const row of userWorkspaces) {
    await deleteWorkspace(db, storage, row.id);
  }
  
  await db.delete(users).where(eq(users.id, id));
}
