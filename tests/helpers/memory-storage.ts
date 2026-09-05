import type { Storage, StoredObject } from "@/server/domain/storage";

export class MemoryStorage implements Storage {
  objects = new Map<string, StoredObject>();
  failWrites = false;

  async put(key: string, bytes: Uint8Array, mime: string) {
    if (this.failWrites) throw new Error("disk full");
    this.objects.set(key, { key, bytes, mime });
  }
  async get(key: string) { return this.objects.get(key) ?? null; }
  async delete(key: string) { this.objects.delete(key); }
  async list(prefix: string) { return [...this.objects.keys()].filter((key) => key.startsWith(prefix)).sort(); }
}
