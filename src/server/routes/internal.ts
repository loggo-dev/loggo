import { Hono } from "hono";
import { reseedDemo } from "../domain/demo-seed";
import type { AppConfig, AppEnv } from "./types";

// Lets the Cloudflare demo's scheduled worker (see cloudflare/worker-entry.ts)
// reseed itself with fresh dates. Mounted ahead of requireAuth in app.ts so
// it works with no session - guarded instead by a shared secret header.
// Self-hosted installs never set reseedSecret, so the route 404s for them.
export function internalRoutes(config: AppConfig) {
  return new Hono<AppEnv>()
    .post("/reseed-demo", async (context) => {
      if (!config.reseedSecret || context.req.header("x-reseed-secret") !== config.reseedSecret) return context.notFound();
      await reseedDemo(context.get("db"), context.get("storage"));
      return context.json({ ok: true });
    });
}
