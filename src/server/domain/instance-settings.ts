import { eq } from "drizzle-orm";
import { settings } from "../db/schema";
import type { AppDb } from "../db/types";

export async function getSettings(db: AppDb) {
  return Object.fromEntries((await db.select().from(settings)).map((row) => [row.key, row.value]));
}

export async function setSettings(db: AppDb, values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    const exists = (await db.select({ key: settings.key }).from(settings).where(eq(settings.key, key)).limit(1)).length > 0;
    if (exists) await db.update(settings).set({ value }).where(eq(settings.key, key));
    else await db.insert(settings).values({ key, value });
  }
}
