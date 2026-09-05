import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { USER_COLORS } from "@/lib/user-colors";
import { updateUser } from "../domain/user";
import type { AppEnv } from "./types";

export const profileRoutes = new Hono<AppEnv>()
  .patch("/", zValidator("json", z.object({ name: z.string().trim().min(1).max(80), color: z.enum(USER_COLORS).optional(), password: z.string().min(8).max(200).optional() })), async (context) => {
    await updateUser(context.get("db"), context.get("user").id, context.req.valid("json"));
    return context.json({ ok: true });
  });
