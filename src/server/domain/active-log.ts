import { and, eq, isNull, type SQL } from "drizzle-orm";
import { logs } from "../db/schema";

export function activeLogWhere(...conditions: (SQL | undefined)[]) {
  return and(isNull(logs.deletedAt), ...conditions);
}

export function activeLogById(id: string) {
  return activeLogWhere(eq(logs.id, id));
}
