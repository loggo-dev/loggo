import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { AppDb } from "../db/types";

export function createD1Db(database: D1Database): AppDb {
  const appDb = drizzle(database, { schema }) as unknown as AppDb;
  // The Workers target is a read-only demo, so this path is never used there.
  // Keeping the seam async lets a future writable D1 target supply a batching implementation.
  appDb.atomic = async <T>(callback: (tx: AppDb) => Promise<T>) => callback(appDb);
  return appDb;
}
