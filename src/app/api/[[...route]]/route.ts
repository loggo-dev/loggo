import { handle } from "hono/vercel";
import { getDb } from "@/server/adapters/db";
import { getStorage } from "@/server/adapters/storage";
import { createApp } from "@/server/app";

export const runtime = "nodejs";

const app = createApp({
  db: getDb(),
  storage: process.env.READ_ONLY === "true" ? null : getStorage(),
  readOnly: process.env.READ_ONLY === "true",
  maxAttachmentSize: Number(process.env.MAX_ATTACHMENT_SIZE ?? 10 * 1024 * 1024),
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES ?? "image/png,image/jpeg,image/gif,image/webp,application/pdf,application/zip,application/x-zip-compressed,text/plain").split(","),
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
