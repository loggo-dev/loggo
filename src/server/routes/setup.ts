import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import { ConflictError } from "../domain/errors";
import { createSession } from "../domain/session";
import { anyUserExists, createUser } from "../domain/user";
import { createPersonalWorkspace } from "../domain/workspace";
import type { AppEnv } from "./types";

const setupSchema = z.object({ name: z.string().trim().min(1).max(80), email: z.email(), password: z.string().min(8).max(200) });

export const setupRoutes = new Hono<AppEnv>()
  .get("/status", async (context) => context.json({ needed: !(await anyUserExists(context.get("db"))) }))
  .post("/", zValidator("json", setupSchema), async (context) => {
    const db = context.get("db");
    if (await anyUserExists(db)) throw new ConflictError("Setup is already complete");
    const values = context.req.valid("json");
    const user = await createUser(db, { ...values, role: "admin" });
    const workspace = await createPersonalWorkspace(db, user);
    const session = await createSession(db, user.id);
    setCookie(context, "loggo_session", session.id, { httpOnly: true, sameSite: "Lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(session.expiresAt) });
    return context.json({ user, workspace }, 201);
  });
