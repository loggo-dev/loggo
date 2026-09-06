import { handle } from "hono/vercel";
import { createApp } from "@/server/app";
import type { AppConfig } from "@/server/routes/types";

export const runtime = "nodejs";

const ALLOWED_FILE_TYPES = "image/png,image/jpeg,image/gif,image/webp,application/pdf,application/zip,application/x-zip-compressed,text/plain";

// Two deploy targets share this route: self-hosted Node (better-sqlite3 +
// local/S3 storage) and Cloudflare Workers (D1 + R2). navigator.userAgent is
// "Cloudflare-Workers" only inside the real workerd runtime - unlike
// getCloudflareContext() succeeding/throwing, this is reliable even with a
// wrangler.jsonc checked into the repo: @opennextjs/cloudflare makes
// getCloudflareContext() resolve during plain `next dev` too (it proxies to
// a local Miniflare D1/R2 sim off that same wrangler.jsonc, since this route
// declares runtime "nodejs"), which would otherwise send local dev to an
// empty simulated D1 instead of the real data/loggo.db. The Cloudflare-only
// branch lives in cloudflare-config.ts, loaded via dynamic import so
// bundling this route for Workers never has to load better-sqlite3's native
// binding. readOnly defaults to false on both targets; set the READ_ONLY var
// (wrangler.jsonc "vars" for Workers) to "true" to lock a deploy down.
async function buildConfig(): Promise<AppConfig> {
  if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
    const { buildCloudflareConfig } = await import("@/server/adapters/cloudflare-config");
    const config = await buildCloudflareConfig();
    if (config) return config;
  }
  const { getDb } = await import("@/server/adapters/db");
  const { getStorage } = await import("@/server/adapters/storage");
  return {
    db: getDb(),
    storage: process.env.READ_ONLY === "true" ? null : getStorage(),
    readOnly: process.env.READ_ONLY === "true",
    maxAttachmentSize: Number(process.env.MAX_ATTACHMENT_SIZE ?? 10 * 1024 * 1024),
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES ?? ALLOWED_FILE_TYPES).split(","),
    reseedSecret: process.env.RESEED_SECRET,
  };
}

let handlerPromise: Promise<ReturnType<typeof handle>> | null = null;
const getHandler = () => (handlerPromise ??= buildConfig().then((config) => handle(createApp(config))));

async function dispatch(request: Request) {
  const handler = await getHandler();
  return handler(request);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
