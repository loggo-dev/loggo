import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { logs, users, workspaceMembers, workspaces } from "../db/schema";
import type { AppDb } from "../db/types";
import { restoreLog } from "./log";
import { parseMirrorFile } from "./mirror";
import type { Storage } from "./storage";
import { DEFAULT_WORKSPACE_COLOR, DEFAULT_WORKSPACE_ICON, isWorkspaceColor, isWorkspaceIcon } from "../../lib/workspace-appearance";

export async function rebuildFromStorage(db: AppDb, storage: Storage) {
  const keys = (await storage.list("workspaces")).filter((key) => key.endsWith(".md"));
  let restored = 0;
  let skipped = 0;
  for (const key of keys) {
    const object = await storage.get(key);
    if (!object) continue;
    const { frontmatter, body } = parseMirrorFile(object.bytes);
    if ((await db.select({ id: logs.id }).from(logs).where(eq(logs.id, frontmatter.id)).limit(1)).length) { skipped += 1; continue; }

    let author = (await db.select().from(users).where(eq(users.name, frontmatter.author)).limit(1))[0];
    if (!author) {
      author = { id: ulid(), email: `rebuild-${ulid().toLowerCase()}@invalid.local`, passwordHash: "disabled-rebuild-account", name: frontmatter.author, color: "bg-blue-500", role: "user", createdAt: frontmatter.created, disabledAt: new Date().toISOString() };
      await db.insert(users).values(author);
    }
    let workspace = (await db.select().from(workspaces).where(eq(workspaces.slug, frontmatter.workspace)).limit(1))[0];
    if (!workspace) {
      workspace = {
        id: ulid(),
        slug: frontmatter.workspace,
        name: frontmatter.workspace_name ?? (frontmatter.workspace.startsWith("personal-") ? "Personal" : frontmatter.workspace),
        color: isWorkspaceColor(frontmatter.workspace_color) ? frontmatter.workspace_color : DEFAULT_WORKSPACE_COLOR,
        icon: isWorkspaceIcon(frontmatter.workspace_icon) ? frontmatter.workspace_icon : DEFAULT_WORKSPACE_ICON,
        kind: frontmatter.workspace.startsWith("personal-") ? "personal" : "shared",
        createdBy: author.id,
        createdAt: frontmatter.created,
      };
      await db.insert(workspaces).values(workspace);
      await db.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: author.id, role: "owner" });
    }
    await restoreLog(db, { id: frontmatter.id, workspaceId: workspace.id, authorId: author.id, day: frontmatter.day, title: frontmatter.title, body, createdAt: frontmatter.created, updatedAt: frontmatter.updated, posX: frontmatter.pos_x, posY: frontmatter.pos_y, width: frontmatter.width, height: frontmatter.height });
    restored += 1;
  }
  return { restored, skipped, total: keys.length };
}
