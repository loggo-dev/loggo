import { Hono } from "hono";
import { listTags } from "../domain/tag";
import type { AppEnv } from "./types";

import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const tagRoutes = new Hono<AppEnv>()
  .get("/", zValidator("query", z.object({ from: day.optional(), to: day.optional(), page: z.coerce.number().int().min(1).optional() })), async (context) => {
    const { getSettings } = await import("../domain/instance-settings");
    const settings = await getSettings(context.get("db"));
    const limit = parseInt(settings.defaultPageSize ?? "10", 10);
    const page = context.req.valid("query").page ?? 1;
    const offset = (page - 1) * limit;

    const results = await listTags(context.get("db"), context.get("workspace").id, { ...context.req.valid("query"), limit: limit + 1, offset });
    const hasMore = results.length > limit;
    if (hasMore) results.pop();

    return context.json({ tags: results, hasMore, page, limit });
  });
