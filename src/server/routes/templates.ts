import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { listTemplates, createTemplate, updateTemplate, deleteTemplate, checkAndApplyTemplates } from "../domain/templates";
import type { AppEnv } from "./types";

export const templateRoutes = new Hono<AppEnv>()
  .get("/", async (context) => {
    const templates = await listTemplates(context.get("db"), context.get("workspace").id);
    return context.json({ templates });
  })
  .post("/", zValidator("json", z.object({ title: z.string().nullable().optional(), body: z.string(), enabled: z.boolean().optional() })), async (context) => {
    const template = await createTemplate(context.get("db"), context.get("storage")!, context.get("workspace").id, context.req.valid("json"));
    return context.json({ template });
  })
  .put("/mode", zValidator("json", z.object({ mode: z.enum(["today_only", "any_visited_day"]) })), async (context) => {
    const { eq } = await import("drizzle-orm");
    const { workspaces } = await import("../db/schema");
    await context.get("db").update(workspaces).set({ templateMode: context.req.valid("json").mode }).where(eq(workspaces.id, context.get("workspace").id));
    return context.json({ success: true });
  })
  .put("/:id", zValidator("json", z.object({ title: z.string().nullable().optional(), body: z.string().optional(), enabled: z.boolean().optional() })), async (context) => {
    const template = await updateTemplate(context.get("db"), context.get("storage")!, context.get("workspace").id, context.req.param("id"), context.req.valid("json"));
    return context.json({ template });
  })
  .delete("/:id", async (context) => {
    await deleteTemplate(context.get("db"), context.get("storage")!, context.get("workspace").id, context.req.param("id"));
    return context.json({ success: true });
  })
  .post("/apply", zValidator("json", z.object({ day: z.string() })), async (context) => {
    const applied = await checkAndApplyTemplates(context.get("db"), context.get("storage")!, context.get("workspace").id, context.get("user").id, context.req.valid("json").day);
    return context.json({ applied });
  });
