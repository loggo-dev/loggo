import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type * as schema from "./schema";

type DrizzleDb = BaseSQLiteDatabase<"sync" | "async", unknown, typeof schema>;

export type AppDb = DrizzleDb & {
  atomic<T>(callback: (tx: AppDb) => Promise<T>): Promise<T>;
};
