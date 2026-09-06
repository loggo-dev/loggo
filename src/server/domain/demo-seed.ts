import type { AppDb } from "../db/types";
import { DEMO_LOGS, DEMO_PASSWORD, DEMO_USERS, DEMO_WORKSPACES, type DemoAttachment, type DemoUserKey } from "./demo-content";
import { createAttachment } from "./attachment";
import { createLog, updateLog } from "./log";
import type { Storage } from "./storage";
import { createUser, deleteUser, findUserByEmail } from "./user";
import { createPersonalWorkspace, createWorkspace } from "./workspace";

// Best-effort: fetches the example image and attaches it to the log. Demo
// users/workspaces/logs matter more than a decorative screenshot, so a
// flaky network shouldn't fail the whole reseed - log a warning and move on.
async function attachDemoImage(db: AppDb, storage: Storage, logId: string, workspaceId: string, body: string, attachment: DemoAttachment) {
  try {
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const mime = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const created = await createAttachment(db, storage, {
      logId, workspaceId, filename: attachment.filename, mime, bytes,
      maxSize: 25 * 1024 * 1024, allowedTypes: ["*/*"],
    });
    await updateLog(db, storage, logId, { body: `${body}\n\n![${attachment.alt}](${created.relativeLink})` }, workspaceId);
  } catch (error) {
    console.warn(`Demo seed: could not attach ${attachment.url}, skipping.`, error);
  }
}

function daysAgo(n: number) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
}

// Wipes and recreates the whole demo team - users, personal + shared
// workspaces, and logs - with `day` recomputed against the current date, so
// the seeded content never goes stale. Reused by both the local `seed:demo`
// script and the Cloudflare demo's scheduled reseed (see
// src/server/routes/internal.ts), so it must be safe to run repeatedly
// against a database that already has demo data in it.
export async function reseedDemo(db: AppDb, storage: Storage | null) {
  for (const demoUser of DEMO_USERS) {
    const existing = await findUserByEmail(db, demoUser.email);
    if (existing) await deleteUser(db, storage, existing.id);
  }

  const userIds = new Map<DemoUserKey, string>();
  for (const demoUser of DEMO_USERS) {
    const user = await createUser(db, { name: demoUser.name, email: demoUser.email, password: DEMO_PASSWORD, role: demoUser.role });
    userIds.set(demoUser.key, user.id);
  }

  const demoUser = DEMO_USERS.find((user) => user.key === "demo")!;
  const demoUserId = userIds.get("demo")!;
  const personalWorkspace = await createPersonalWorkspace(db, { id: demoUserId, name: demoUser.name });

  const workspaceIds = new Map<"personal" | (typeof DEMO_WORKSPACES)[number]["key"], string>();
  workspaceIds.set("personal", personalWorkspace.id);
  for (const demoWorkspace of DEMO_WORKSPACES) {
    const workspace = await createWorkspace(db, {
      name: demoWorkspace.name,
      kind: "shared",
      createdBy: demoUserId,
      members: demoWorkspace.members.filter((key) => key !== "demo").map((key) => userIds.get(key)!),
      color: demoWorkspace.color,
      icon: demoWorkspace.icon,
    });
    workspaceIds.set(demoWorkspace.key, workspace.id);
  }

  for (const log of DEMO_LOGS) {
    const workspaceId = workspaceIds.get(log.workspace)!;
    const created = await createLog(db, storage, {
      workspaceId,
      authorId: userIds.get(log.author)!,
      day: daysAgo(-log.dayOffset),
      title: log.title,
      body: log.body,
      posX: log.posX,
      posY: log.posY,
    });
    if (log.attachment && storage) await attachDemoImage(db, storage, created.id, workspaceId, log.body, log.attachment);
  }
}
