import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { searchWorkspace } from "../domain/search";
import type { AppEnv } from "./types";

export const searchRoutes = new Hono<AppEnv>()
  .get("/", zValidator("query", z.object({ q: z.string().max(500) })), async (context) => context.json({ results: await searchWorkspace(context.get("db"), context.get("workspace").id, context.req.valid("query").q) }));
