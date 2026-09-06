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

// tsx transforms this file as CommonJS in this repo (no `"type": "module"` in
// package.json), which does not support top-level await — everything below
// runs inside an async IIFE instead.
async function main() {
  const { getDb } = await import("../src/server/adapters/db");
  const { getLocalStorage } = await import("../src/server/adapters/local-storage");
  const { reseedDemo } = await import("../src/server/domain/demo-seed");
  const { DEMO_EMAIL, DEMO_PASSWORD } = await import("../src/server/domain/demo-content");

  await reseedDemo(getDb(), getLocalStorage());

  console.log("Demo data seeded.");
  console.log(`  Log in at /login with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
