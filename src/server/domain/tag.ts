import { and, count, desc, eq, isNull, gte, lte } from "drizzle-orm";
import { logTags, logs, tags } from "../db/schema";
import type { AppDb } from "../db/types";

export async function listTags(db: AppDb, workspaceId: string, filters: { from?: string; to?: string; limit?: number; offset?: number } = {}) {
  const query = db.select({ id: tags.id, name: tags.name, count: count(logTags.logId) })
    .from(tags)
    .leftJoin(logTags, eq(tags.id, logTags.tagId))
    .leftJoin(logs, and(
      eq(logTags.logId, logs.id),
      isNull(logs.deletedAt),
      filters.from ? gte(logs.day, filters.from) : undefined,
      filters.to ? lte(logs.day, filters.to) : undefined
    ))
    .where(eq(tags.workspaceId, workspaceId))
    .groupBy(tags.id)
    .orderBy(desc(count(logTags.logId)), tags.name);

  if (filters.limit) query.limit(filters.limit);
  if (filters.offset) query.offset(filters.offset);

  return query;
}
