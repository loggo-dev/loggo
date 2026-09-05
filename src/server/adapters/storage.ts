import type { Storage } from "../domain/storage";
import { getLocalStorage } from "./local-storage";
import { S3Storage } from "./s3-storage";

let singleton: Storage | null | undefined;

export function getStorage(): Storage | null {
  if (singleton !== undefined) return singleton;
  const backend = process.env.STORAGE_BACKEND ?? "local";
  if (backend === "off") return (singleton = null);
  if (backend === "s3") {
    if (!process.env.S3_BUCKET) throw new Error("S3_BUCKET is required when STORAGE_BACKEND=s3");
    return (singleton = new S3Storage(process.env.S3_BUCKET, {
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } : undefined,
    }));
  }
  return (singleton = getLocalStorage());
}
