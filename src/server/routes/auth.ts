import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { UnauthorizedError } from "../domain/errors";
import { verifyPassword } from "../domain/password";
import { createSession, deleteSession } from "../domain/session";
import { findUserByEmail } from "../domain/user";
import { listUserWorkspaces } from "../domain/workspace";
import { requireAuth } from "./middleware";
import type { AppEnv } from "./types";

export const authRoutes = new Hono<AppEnv>()
  .post("/login", zValidator("json", z.object({ email: z.email(), password: z.string().min(1) })), async (context) => {
    const values = context.req.valid("json");
    const user = await findUserByEmail(context.get("db"), values.email);
    if (!user || user.disabledAt || !(await verifyPassword(values.password, user.passwordHash))) throw new UnauthorizedError("Email or password is wrong");
    const session = await createSession(context.get("db"), user.id);
    setCookie(context, "loggo_session", session.id, { httpOnly: true, sameSite: "Lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(session.expiresAt) });
    return context.json({ user: { id: user.id, email: user.email, name: user.name, color: user.color, role: user.role } });
  })
  .post("/logout", async (context) => {
    const token = getCookie(context, "loggo_session");
    if (token) await deleteSession(context.get("db"), token);
    deleteCookie(context, "loggo_session", { path: "/" });
    return context.json({ ok: true });
  })
  .get("/me", requireAuth, async (context) => {
    const user = context.get("user");
    return context.json({ user: { id: user.id, email: user.email, name: user.name, color: user.color, role: user.role }, workspaces: await listUserWorkspaces(context.get("db"), user.id) });
  });
