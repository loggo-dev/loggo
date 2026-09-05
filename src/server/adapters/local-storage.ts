import fs from "node:fs/promises";
import path from "node:path";
import type { Storage, StoredObject } from "../domain/storage";

const mimeByExtension: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

export class LocalStorage implements Storage {
  constructor(private readonly root = process.env.STORAGE_PATH ?? "./data") {}

  private resolve(key: string) {
    const normalized = path.posix.normalize(key).replace(/^\/+/, "");
    if (normalized.startsWith("../") || normalized === "..") throw new Error("Invalid storage key");
    return path.join(this.root, ...normalized.split("/"));
  }

  async put(key: string, bytes: Uint8Array): Promise<void> {
    const filename = this.resolve(key);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, bytes);
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      return {
        key,
        bytes: await fs.readFile(this.resolve(key)),
        mime: mimeByExtension[path.extname(key).toLowerCase()] ?? "application/octet-stream",
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  async list(prefix: string): Promise<string[]> {
    const root = this.resolve(prefix);
    const results: string[] = [];
    const walk = async (directory: string): Promise<void> => {
      let entries: import("node:fs").Dirent[];
      try {
        entries = await fs.readdir(directory, { withFileTypes: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
        throw error;
      }
      for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(absolute);
        else results.push(path.relative(this.root, absolute).split(path.sep).join("/"));
      }
    };
    await walk(root);
    return results.sort();
  }
}

let singleton: Storage | undefined;
export function getLocalStorage(): Storage {
  singleton ??= new LocalStorage();
  return singleton;
}
