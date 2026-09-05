import { sql } from "drizzle-orm";
import type { AppDb } from "../db/types";

export type SearchResult = {
  type: "log" | "tag" | "task";
  id: string;
  title: string;
  snippet: string;
  day: string | null;
};

function ftsQuery(query: string) {
  return query.trim().split(/\s+/).map((token) => `"${token.replaceAll('"', '""')}"*`).join(" AND ");
}

export async function searchWorkspace(db: AppDb, workspaceId: string, query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const match = ftsQuery(query);
  const logRows = await db.all(sql`
    SELECT 'log' AS type, l.id, coalesce(l.title, 'Untitled Log') AS title,
      snippet(logs_fts, 3, '<mark>', '</mark>', ' … ', 24) AS snippet, l.day
    FROM logs_fts JOIN logs l ON l.id = logs_fts.log_id
    WHERE logs_fts MATCH ${match} AND logs_fts.workspace_id = ${workspaceId} AND l.deleted_at IS NULL
    ORDER BY bm25(logs_fts) LIMIT 12
  `) as SearchResult[];
  const like = `%${query.trim()}%`;
  const otherRows = await db.all(sql`
    SELECT 'tag' AS type, t.id, ('#' || t.name) AS title, '' AS snippet, NULL AS day
    FROM tags t WHERE t.workspace_id = ${workspaceId} AND t.name LIKE ${like}
    UNION ALL
    SELECT 'task' AS type, ta.id, ta.text AS title, coalesce(l.title, 'Untitled Log') AS snippet, l.day
    FROM tasks ta JOIN logs l ON l.id = ta.log_id
    WHERE ta.workspace_id = ${workspaceId} AND ta.text LIKE ${like} AND l.deleted_at IS NULL
    LIMIT 12
  `) as SearchResult[];
  return [...logRows, ...otherRows].slice(0, 24);
}
