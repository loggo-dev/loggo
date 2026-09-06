// The generic D1Database/R2Bucket/etc. shapes come from @cloudflare/workers-types
// (see tsconfig.json's "types"), but this app's own bindings (wrangler.jsonc)
// are project-specific and normally only declared by the `wrangler types`
// output (cloudflare-env.d.ts at the repo root - gitignored, regenerated via
// `npm run cf-typegen`). This checked-in file declares just enough of that
// same global CloudflareEnv interface so `tsc`/CI don't depend on that
// generated file existing; the two merge without conflict when it does.
export {};

declare global {
  interface CloudflareEnv {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    READ_ONLY?: string;
    MAX_ATTACHMENT_SIZE?: string;
    ALLOWED_FILE_TYPES?: string;
    RESEED_SECRET?: string;
  }
}
