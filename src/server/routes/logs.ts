import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createLog, deleteLog, duplicateLog, getLog, listLogs, moveLog, setLogPosition, setLogSize, setLogZIndex, updateLog } from "../domain/log";
import type { AppEnv } from "./types";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const logInput = z.object({ day, title: z.string().max(200).nullable().optional(), body: z.string().max(2_000_000), isLocked: z.boolean().optional() });
const createInput = logInput.extend({ posX: z.number().int().optional(), posY: z.number().int().optional() });

export const logRoutes = new Hono<AppEnv>()
  .get("/", zValidator("query", z.object({ day: day.optional(), from: day.optional(), to: day.optional(), tag: z.string().optional(), page: z.coerce.number().int().min(1).optional() })), async (context) => {
    const { getSettings } = await import("../domain/instance-settings");
    const settings = await getSettings(context.get("db"));
    const isDayQuery = !!context.req.valid("query").day;
    const limit = isDayQuery ? 100 : parseInt(settings.defaultPageSize ?? "10", 10);
    const page = isDayQuery ? 1 : (context.req.valid("query").page ?? 1);
    const offset = (page - 1) * limit;
    
    // Request limit + 1 to check if there is a next page
    const results = await listLogs(context.get("db"), context.get("workspace").id, { ...context.req.valid("query"), limit: limit + 1, offset });
    const hasMore = results.length > limit;
    if (hasMore) results.pop();
    
    return context.json({ logs: results, hasMore, page, limit });
  })
  .post("/", zValidator("json", createInput), async (context) => {
    return context.json(await createLog(context.get("db"), context.get("storage"), { ...context.req.valid("json"), workspaceId: context.get("workspace").id, authorId: context.get("user").id }), 201);
  })
  .get("/:logId", async (context) => context.json(await getLog(context.get("db"), context.req.param("logId"), context.get("workspace").id)))
  .patch("/:logId", zValidator("json", logInput.omit({ day: true }).partial()), async (context) => context.json(await updateLog(context.get("db"), context.get("storage"), context.req.param("logId"), context.req.valid("json"), context.get("workspace").id)))
  .patch("/:logId/position", zValidator("json", z.object({ posX: z.number().int(), posY: z.number().int() })), async (context) => {
    await setLogPosition(context.get("db"), context.req.param("logId"), context.get("workspace").id, context.req.valid("json").posX, context.req.valid("json").posY);
    return context.json({ ok: true });
  })
  .patch("/:logId/size", zValidator("json", z.object({ width: z.number().int(), height: z.number().int() })), async (context) => {
    await setLogSize(context.get("db"), context.req.param("logId"), context.get("workspace").id, context.req.valid("json").width, context.req.valid("json").height);
    return context.json({ ok: true });
  })
  .patch("/:logId/zindex", zValidator("json", z.object({ zIndex: z.number().int() })), async (context) => {
    await setLogZIndex(context.get("db"), context.req.param("logId"), context.get("workspace").id, context.req.valid("json").zIndex);
    return context.json({ ok: true });
  })
  .post("/:logId/duplicate", async (context) => context.json(await duplicateLog(context.get("db"), context.get("storage"), context.req.param("logId"), context.get("workspace").id, context.get("user").id), 201))
  .post("/:logId/move/:targetWorkspaceId", async (context) => context.json(await moveLog(context.get("db"), context.get("storage"), context.req.param("logId"), context.get("workspace").id, context.get("targetWorkspace").id)))
  .delete("/:logId", async (context) => { await deleteLog(context.get("db"), context.get("storage"), context.req.param("logId"), context.get("workspace").id); return context.json({ ok: true }); });
