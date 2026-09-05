import { createNodeDb } from "@/server/adapters/db";

export function createTestDb() {
  return createNodeDb(":memory:");
}
