import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { setTaskDone } from "../domain/log";
import { listTasks } from "../domain/task";
import type { AppEnv } from "./types";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const taskRoutes = new Hono<AppEnv>()
  .get("/", zValidator("query", z.object({ day: day.optional(), board: day.optional(), from: day.optional(), to: day.optional(), status: z.enum(["pending", "completed"]).optional(), page: z.coerce.number().int().min(1).optional() })), async (context) => {
    const { getSettings } = await import("../domain/instance-settings");
    const settings = await getSettings(context.get("db"));
    const isDayQuery = !!(context.req.valid("query").day || context.req.valid("query").board);
    const limit = isDayQuery ? 100 : parseInt(settings.defaultPageSize ?? "10", 10);
    const page = isDayQuery ? 1 : (context.req.valid("query").page ?? 1);
    const offset = (page - 1) * limit;

    const results = await listTasks(context.get("db"), context.get("workspace").id, { ...context.req.valid("query"), limit: limit + 1, offset });
    const hasMore = results.length > limit;
    if (hasMore) results.pop();

    return context.json({ tasks: results, hasMore, page, limit });
  })
  .patch("/:taskId", zValidator("json", z.object({ done: z.boolean() })), async (context) => {
    const log = await setTaskDone(context.get("db"), context.get("storage"), context.req.param("taskId"), context.req.valid("json").done, context.get("workspace").id);
    return context.json({ log });
  });
