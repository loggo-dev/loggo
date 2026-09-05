import { and, eq, gt, isNull } from "drizzle-orm";
import { sessions, users } from "../db/schema";
import type { AppDb } from "../db/types";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(db: AppDb, userId: string) {
  const session = { id: crypto.randomUUID(), userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() };
  await db.insert(sessions).values(session);
  return { id: session.id, expiresAt: session.expiresAt };
}

export async function validateSession(db: AppDb, id: string) {
  const row = (await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date().toISOString()), isNull(users.disabledAt)))
    .limit(1))[0];
  return row?.user ?? null;
}

export async function deleteSession(db: AppDb, id: string) {
  await db.delete(sessions).where(eq(sessions.id, id));
}
