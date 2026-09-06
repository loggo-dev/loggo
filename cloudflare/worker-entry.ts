// @ts-nocheck - imports .open-next/worker.js, a gitignored build artifact
// that only exists after `opennextjs-cloudflare build` runs (see
// package.json's build:workers/deploy:workers scripts), so this can't be
// type-checked standalone.
//
// Wrangler's own bundling of "main" (wrangler.jsonc) doesn't resolve the
// project's "@/*" tsconfig path alias, so this file (and only this file)
// intentionally imports nothing beyond the already-Next.js-bundled
// OpenNext worker - see src/server/routes/internal.ts for why the actual
// reseed logic lives behind an HTTP route instead of being imported here
// directly.
import openNextWorker from "../.open-next/worker.js";

export default {
  fetch: openNextWorker.fetch,
  // Cloudflare Cron Trigger (wrangler.jsonc "triggers.crons") - reseeds the
  // demo daily by calling the app's own internal route, authenticated with
  // RESEED_SECRET (`wrangler secret put RESEED_SECRET`).
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      openNextWorker.fetch(
        new Request("https://internal.invalid/api/internal/reseed-demo", {
          method: "POST",
          headers: { "x-reseed-secret": env.RESEED_SECRET ?? "" },
        }),
        env,
        ctx,
      ),
    );
  },
};

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from "../.open-next/worker.js";
