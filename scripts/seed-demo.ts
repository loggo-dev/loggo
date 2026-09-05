import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.SQLITE_PATH ?? "./data/loggo.db";
const storagePath = process.env.STORAGE_PATH ?? "./data";

for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${dbPath}${suffix}`;
  if (fs.existsSync(file)) fs.rmSync(file);
}
const workspacesDir = path.join(storagePath, "workspaces");
if (fs.existsSync(workspacesDir)) fs.rmSync(workspacesDir, { recursive: true, force: true });

function daysAgo(n: number) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
}

// tsx transforms this file as CommonJS in this repo (no `"type": "module"` in
// package.json), which does not support top-level await — everything below
// runs inside an async IIFE instead.
async function main() {
  const { getDb } = await import("../src/server/adapters/db");
  const { getLocalStorage } = await import("../src/server/adapters/local-storage");
  const { createUser } = await import("../src/server/domain/user");
  const { createPersonalWorkspace } = await import("../src/server/domain/workspace");
  const { createLog } = await import("../src/server/domain/log");

  const DEMO_EMAIL = "demo@loggo.dev";
  const DEMO_PASSWORD = "demo@loggo.dev";

  const db = getDb();
  const storage = getLocalStorage();

  const user = await createUser(db, { name: "Demo", email: DEMO_EMAIL, password: DEMO_PASSWORD, role: "admin" });
  const workspace = await createPersonalWorkspace(db, user);

  const today = daysAgo(0);
  const yesterday = daysAgo(1);

  await createLog(db, storage, {
    workspaceId: workspace.id, authorId: user.id, day: today, title: "Welcome to Loggo",
    body: "Loggo is a self-hosted note app for engineers. Drop **Logs** onto the day board as you work.\n\nTry `#tags`, `- [ ]` tasks, and fenced code blocks — each renders a little differently on its card.",
    posX: 24, posY: 24,
  });

  await createLog(db, storage, {
    workspaceId: workspace.id, authorId: user.id, day: today,
    body: "- [ ] Ship the release notes !tomorrow\n- [x] Review the pull request\n- [ ] Reply to the customer thread !today",
    posX: 440, posY: 24,
  });

  await createLog(db, storage, {
    workspaceId: workspace.id, authorId: user.id, day: today,
    body: "```ts\nexport function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n```",
    posX: 24, posY: 320,
  });

  await createLog(db, storage, {
    workspaceId: workspace.id, authorId: user.id, day: yesterday, title: "Postgres tuning notes",
    body: "Bumped `work_mem` and re-ran the slow query report. Down from 4.2s to 380ms. #postgres #perf",
    posX: 24, posY: 24,
  });

  console.log("Demo data seeded.");
  console.log(`  Log in at /login with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
