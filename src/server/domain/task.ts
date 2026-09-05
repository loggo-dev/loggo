import { and, asc, eq, isNull, gte, lte, or } from "drizzle-orm";
import { logs, tasks } from "../db/schema";
import type { AppDb } from "../db/types";

export async function listTasks(db: AppDb, workspaceId: string, filters: { day?: string; board?: string; from?: string; to?: string; status?: "pending" | "completed"; limit?: number; offset?: number } = {}) {
  const query = db.select({
    id: tasks.id,
    logId: tasks.logId,
    text: tasks.text,
    done: tasks.done,
    dueDate: tasks.dueDate,
    lineNo: tasks.lineNo,
    completedAt: tasks.completedAt,
    logTitle: logs.title,
    day: logs.day,
  }).from(tasks)
    .innerJoin(logs, eq(tasks.logId, logs.id))
    .where(and(
      eq(tasks.workspaceId, workspaceId),
      isNull(logs.deletedAt),
      filters.day ? eq(logs.day, filters.day) : undefined,
      // The day board's task widget for `board` isn't "tasks in today's log" -
      // it's "what's actionable today": undated tasks written into today's
      // log (no due date yet, so they default to today), plus any task due
      // today regardless of which day's log it was written into (a Log's day
      // never moves once set, per AGENTS.md, so due date is the only way a
      // task written on an earlier day can belong to today).
      filters.board ? or(and(eq(logs.day, filters.board), isNull(tasks.dueDate)), eq(tasks.dueDate, filters.board)) : undefined,
      filters.from ? gte(logs.day, filters.from) : undefined,
      filters.to ? lte(logs.day, filters.to) : undefined,
      filters.status === "pending" ? eq(tasks.done, false) : undefined,
      filters.status === "completed" ? eq(tasks.done, true) : undefined
    ))
    .orderBy(asc(tasks.done), asc(tasks.dueDate), asc(logs.day));

  if (filters.limit) query.limit(filters.limit);
  if (filters.offset) query.offset(filters.offset);
  
  return query;
}
