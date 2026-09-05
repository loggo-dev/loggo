import { getDb } from "../server/adapters/db";
import { getLocalStorage } from "../server/adapters/local-storage";
import { rebuildFromStorage } from "../server/domain/rebuild";

// tsx transforms this file as CommonJS in this repo (no `"type": "module"` in
// package.json), which does not support top-level await.
async function main() {
  const result = await rebuildFromStorage(getDb(), getLocalStorage());
  console.log(`Rebuild complete: ${result.restored} restored, ${result.skipped} already present.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
