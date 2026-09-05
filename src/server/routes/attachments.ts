import { Hono } from "hono";
import { createAttachment, deleteAttachment, getAttachment, listAttachmentExtensions, listAttachments } from "../domain/attachment";
import type { AppConfig, AppEnv } from "./types";

import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const extension = z.string().regex(/^[a-zA-Z0-9]+$/);

export function attachmentRoutes(config: AppConfig) {
  return new Hono<AppEnv>()
    .get("/", zValidator("query", z.object({ from: day.optional(), to: day.optional(), extension: extension.optional(), page: z.coerce.number().int().min(1).optional() })), async (context) => {
      const { getSettings } = await import("../domain/instance-settings");
      const settings = await getSettings(context.get("db"));
      const limit = parseInt(settings.defaultPageSize ?? "10", 10);
      const page = context.req.valid("query").page ?? 1;
      const offset = (page - 1) * limit;

      const results = await listAttachments(context.get("db"), context.get("workspace").id, { ...context.req.valid("query"), limit: limit + 1, offset });
      const hasMore = results.length > limit;
      if (hasMore) results.pop();

      return context.json({ attachments: results, hasMore, page, limit });
    })
    .get("/extensions", async (context) => {
      const extensions = await listAttachmentExtensions(context.get("db"), context.get("workspace").id);
      return context.json({ extensions });
    })
    .post("/", async (context) => {
      const storage = context.get("storage");
      if (!storage) return context.json({ error: { code: "STORAGE_OFF", message: "Storage is disabled" } }, 503);
      const form = await context.req.formData();
      const file = form.get("file");
      const logId = form.get("logId");
      if (!(file instanceof File) || typeof logId !== "string") return context.json({ error: { code: "VALIDATION", message: "file and logId are required" } }, 400);
      
      const { getSettings } = await import("../domain/instance-settings");
      const settings = await getSettings(context.get("db"));
      const allowedTypes = settings.allowedFileTypes ? settings.allowedFileTypes.split(",") : config.allowedFileTypes;
      const maxSize = settings.maxAttachmentSize ? parseInt(settings.maxAttachmentSize, 10) : config.maxAttachmentSize;
      
      return context.json(await createAttachment(context.get("db"), storage, { logId, workspaceId: context.get("workspace").id, filename: file.name, mime: file.type || "application/octet-stream", bytes: new Uint8Array(await file.arrayBuffer()), maxSize, allowedTypes }), 201);
    })
    .get("/:attachmentId/file", async (context) => {
      const storage = context.get("storage");
      if (!storage) return context.notFound();
      const attachment = await getAttachment(context.get("db"), context.get("workspace").id, context.req.param("attachmentId"));
      const object = await storage.get(attachment.storageKey);
      if (!object) return context.notFound();
      return new Response(object.bytes as BodyInit, { headers: { "content-type": attachment.mime, "content-disposition": `inline; filename="${attachment.filename.replaceAll('"', '')}"` } });
    })
    .delete("/:attachmentId", async (context) => {
      const storage = context.get("storage");
      if (!storage) return context.notFound();
      await deleteAttachment(context.get("db"), storage, context.get("workspace").id, context.req.param("attachmentId"));
      return context.json({ ok: true });
    });
}
