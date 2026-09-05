import { Hono } from "hono";
import { listUserWorkspaces } from "../domain/workspace";
import type { AppEnv } from "./types";

export const workspaceRoutes = new Hono<AppEnv>()
  .get("/", async (context) => context.json({ workspaces: await listUserWorkspaces(context.get("db"), context.get("user").id) }));
