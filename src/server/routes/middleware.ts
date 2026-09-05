import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { ForbiddenError, UnauthorizedError } from "../domain/errors";
import { validateSession } from "../domain/session";
import { requireWorkspaceMember } from "../domain/workspace";
import type { AppConfig, AppEnv } from "./types";

export const injectDependencies = (config: AppConfig) => createMiddleware<AppEnv>(async (context, next) => {
  context.set("db", config.db);
  context.set("storage", config.storage);
  await next();
});

export const requireAuth = createMiddleware<AppEnv>(async (context, next) => {
  const token = getCookie(context, "loggo_session");
  const user = token ? await validateSession(context.get("db"), token) : null;
  if (!user) throw new UnauthorizedError();
  context.set("user", user);
  await next();
});

export const requireAdmin = createMiddleware<AppEnv>(async (context, next) => {
  if (context.get("user").role !== "admin") throw new ForbiddenError("Admin access required");
  await next();
});

export const requireWorkspace = createMiddleware<AppEnv>(async (context, next) => {
  const workspaceId = context.req.param("workspaceId");
  if (!workspaceId) throw new ForbiddenError("Workspace is required");
  const membership = await requireWorkspaceMember(context.get("db"), context.get("user").id, workspaceId);
  context.set("workspace", membership.workspace);
  context.set("membershipRole", membership.role);
  await next();
});

export const requireTargetWorkspace = createMiddleware<AppEnv>(async (context, next) => {
  const targetWorkspaceId = context.req.param("targetWorkspaceId");
  if (!targetWorkspaceId) throw new ForbiddenError("Target workspace is required");
  const membership = await requireWorkspaceMember(context.get("db"), context.get("user").id, targetWorkspaceId);
  context.set("targetWorkspace", membership.workspace);
  await next();
});

export const rejectReadOnly = (readOnly: boolean) => createMiddleware<AppEnv>(async (context, next) => {
  if (readOnly && !["GET", "HEAD", "OPTIONS"].includes(context.req.method)) throw new ForbiddenError("This demo is read-only");
  await next();
});
