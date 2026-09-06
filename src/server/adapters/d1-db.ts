import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import type { AppDb } from "../db/types";

export function createD1Db(database: D1Database): AppDb {
  const appDb = drizzle(database, { schema }) as unknown as AppDb;
  // D1's binding driver doesn't support BEGIN/COMMIT (drizzle's .transaction()
  // fails with "Failed query: begin"), so there's no real atomicity to give
  // here - callers still run, just without rollback-on-error.
  appDb.atomic = async <T>(callback: (tx: AppDb) => Promise<T>) => callback(appDb);
  return appDb;
}
