import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { USER_COLORS } from "@/lib/user-colors";
import { WORKSPACE_COLORS, WORKSPACE_ICONS } from "@/lib/workspace-appearance";
import { getSettings, setSettings } from "../domain/instance-settings";
import { createUser, listUsers, updateUser, deleteUser } from "../domain/user";
import { createPersonalWorkspace, createWorkspace, setWorkspaceMembers, updateWorkspace, deleteWorkspace } from "../domain/workspace";
import { workspaces, workspaceMembers } from "../db/schema";
import { eq } from "drizzle-orm";
import type { AppEnv } from "./types";

export const adminRoutes = new Hono<AppEnv>()
  .get("/users", async (context) => context.json({ users: await listUsers(context.get("db")) }))
  .post("/users", zValidator("json", z.object({ name: z.string().trim().min(1).max(80), email: z.email(), password: z.string().min(8).max(200), role: z.enum(["admin", "user"]), color: z.enum(USER_COLORS).optional() })), async (context) => {
    const user = await createUser(context.get("db"), context.req.valid("json"));
    await createPersonalWorkspace(context.get("db"), user);
    return context.json(user, 201);
  })
  .patch("/users/:userId", zValidator("json", z.object({ name: z.string().min(1).max(80).optional(), password: z.string().min(8).max(200).optional(), role: z.enum(["admin", "user"]).optional(), color: z.enum(USER_COLORS).optional(), disabled: z.boolean().optional() })), async (context) => {
    await updateUser(context.get("db"), context.req.param("userId"), context.req.valid("json"));
    return context.json({ ok: true });
  })
  .delete("/users/:userId", async (context) => {
    await deleteUser(context.get("db"), context.get("storage"), context.req.param("userId"));
    return context.json({ ok: true });
  })
  .get("/workspaces", async (context) => {
    const rows = await context.get("db").select({ workspace: workspaces, userId: workspaceMembers.userId, role: workspaceMembers.role }).from(workspaces).leftJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId));
    const grouped = rows.reduce<Record<string, { workspace: typeof workspaces.$inferSelect; members: { userId: string; role: string }[] }>>((result, row) => {
      result[row.workspace.id] ??= { workspace: row.workspace, members: [] };
      if (row.userId && row.role) result[row.workspace.id].members.push({ userId: row.userId, role: row.role });
      return result;
    }, {});
    return context.json({ workspaces: Object.values(grouped) });
  })
  .post("/workspaces", zValidator("json", z.object({ name: z.string().trim().min(1).max(80), color: z.enum(WORKSPACE_COLORS).optional(), icon: z.enum(WORKSPACE_ICONS).optional(), memberIds: z.array(z.string()).default([]) })), async (context) => {
    const values = context.req.valid("json");
    return context.json(await createWorkspace(context.get("db"), { name: values.name, color: values.color, icon: values.icon, kind: "shared", createdBy: context.get("user").id, members: values.memberIds }), 201);
  })
  .patch("/workspaces/:workspaceId", zValidator("json", z.object({ name: z.string().trim().min(1).max(80), color: z.enum(WORKSPACE_COLORS), icon: z.enum(WORKSPACE_ICONS) })), async (context) => {
    await updateWorkspace(context.get("db"), context.req.param("workspaceId"), context.req.valid("json"));
    return context.json({ ok: true });
  })
  .put("/workspaces/:workspaceId/members", zValidator("json", z.object({ userIds: z.array(z.string()) })), async (context) => {
    await setWorkspaceMembers(context.get("db"), context.req.param("workspaceId"), context.req.valid("json").userIds);
    return context.json({ ok: true });
  })
  .delete("/workspaces/:workspaceId", async (context) => {
    await deleteWorkspace(context.get("db"), context.get("storage"), context.req.param("workspaceId"));
    return context.json({ ok: true });
  })
  .get("/instance", async (context) => context.json({ settings: await getSettings(context.get("db")) }))
  .put("/instance", zValidator("json", z.record(z.string(), z.string())), async (context) => {
    await setSettings(context.get("db"), context.req.valid("json"));
    return context.json({ ok: true });
  });
