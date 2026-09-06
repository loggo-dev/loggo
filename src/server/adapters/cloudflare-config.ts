import { DEMO_MODE } from "@/lib/demo-mode";
import type { AppConfig } from "../routes/types";

const ALLOWED_FILE_TYPES = "image/png,image/jpeg,image/gif,image/webp,application/pdf,application/zip,application/x-zip-compressed,text/plain";

// Split out from route.ts (like d1-db.ts/r2-storage.ts) purely to keep the
// Cloudflare-only branch out of the Node bundle's module graph - see the
// comment in route.ts. Types for env.DB/env.BUCKET/etc. come from
// cloudflare-env.d.ts (checked in, next to this file).
export async function buildCloudflareConfig(): Promise<AppConfig | null> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) return null;

  const { createD1Db } = await import("./d1-db");
  const { R2Storage } = await import("./r2-storage");
  // DEMO_MODE is baked in at build time (build:workers sets
  // NEXT_PUBLIC_DEMO_MODE=true - see src/lib/demo-mode.ts), so the public
  // demo is read-only even if wrangler.jsonc's READ_ONLY var is ever
  // missing or misconfigured - it doesn't rely on remembering to set both.
  const readOnly = DEMO_MODE || env.READ_ONLY === "true";
  return {
    db: createD1Db(env.DB),
    // Not gated on `readOnly`: mutations are already rejected by
    // rejectReadOnly in every route that matters, and attachments still need
    // to be readable (GET /file) on the read-only demo.
    storage: env.BUCKET ? new R2Storage(env.BUCKET) : null,
    readOnly,
    maxAttachmentSize: Number(env.MAX_ATTACHMENT_SIZE ?? 10 * 1024 * 1024),
    allowedFileTypes: (env.ALLOWED_FILE_TYPES ?? ALLOWED_FILE_TYPES).split(","),
    reseedSecret: env.RESEED_SECRET,
  };
}
