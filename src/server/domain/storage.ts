export interface StoredObject {
  key: string;
  bytes: Uint8Array;
  mime: string;
}

export interface Storage {
  put(key: string, bytes: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}
