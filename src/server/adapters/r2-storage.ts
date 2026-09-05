import type { Storage, StoredObject } from "../domain/storage";

export class R2Storage implements Storage {
  constructor(private readonly bucket: R2Bucket) {}

  async put(key: string, bytes: Uint8Array, mime: string): Promise<void> {
    await this.bucket.put(key, bytes, { httpMetadata: { contentType: mime } });
  }

  async get(key: string): Promise<StoredObject | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    return {
      key,
      bytes: new Uint8Array(await object.arrayBuffer()),
      mime: object.httpMetadata?.contentType ?? "application/octet-stream",
    };
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await this.bucket.list({ prefix, cursor });
      keys.push(...page.objects.map((object) => object.key));
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    return keys;
  }
}
