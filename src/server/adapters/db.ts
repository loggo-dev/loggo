import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../db/schema";
import type { AppDb } from "../db/types";

export function createNodeDb(filename = process.env.SQLITE_PATH ?? "./data/loggo.db"): AppDb {
  if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });
  const sqlite = new Database(filename);
  sqlite.pragma("foreign_keys = ON");
  if (filename !== ":memory:") sqlite.pragma("journal_mode = WAL");
  const database = drizzle(sqlite, { schema });
  migrate(database, { migrationsFolder: "./src/server/db/migrations" });
  const appDb = database as unknown as AppDb;
  appDb.atomic = async <T>(callback: (tx: AppDb) => Promise<T>) => {
    await appDb.run(sql.raw("BEGIN IMMEDIATE"));
    try {
      const result = await callback(appDb);
      await appDb.run(sql.raw("COMMIT"));
      return result;
    } catch (error) {
      await appDb.run(sql.raw("ROLLBACK"));
      throw error;
    }
  };
  return appDb;
}

let singleton: AppDb | undefined;

export function getDb(): AppDb {
  singleton ??= createNodeDb();
  return singleton;
}
