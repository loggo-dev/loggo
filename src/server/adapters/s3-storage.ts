import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Storage, StoredObject } from "../domain/storage";

export class S3Storage implements Storage {
  private readonly client: S3Client;

  constructor(private readonly bucket: string, options: NonNullable<ConstructorParameters<typeof S3Client>[0]>) {
    this.client = new S3Client(options);
  }

  async put(key: string, bytes: Uint8Array, mime: string): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: bytes, ContentType: mime }));
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!response.Body) return null;
      return { key, bytes: await response.Body.transformToByteArray(), mime: response.ContentType ?? "application/octet-stream" };
    } catch (error) {
      if ((error as { name?: string }).name === "NoSuchKey") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const page = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }));
      keys.push(...(page.Contents ?? []).flatMap((object) => object.Key ? [object.Key] : []));
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
    return keys;
  }
}
