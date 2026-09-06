import { argon2Verify, argon2id } from "hash-wasm";

// Cloudflare Workers refuses to compile WebAssembly from raw bytes at
// runtime ("Wasm code generation disallowed by embedder"), which is exactly
// how hash-wasm loads argon2 - so it can never run there. Self-hosted Node
// deployments have no such restriction. Rather than branch on the deploy
// target, this probes the capability directly (cached after the first call)
// and falls back to a Web Crypto PBKDF2 hash, which both runtimes support
// natively. Each environment only ever verifies hashes it created itself,
// so the two formats never need to cross-verify.
const MINIMAL_WASM_MODULE = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
let wasmCompileAllowed: Promise<boolean> | null = null;

function canCompileWasm(): Promise<boolean> {
  wasmCompileAllowed ??= WebAssembly.compile(MINIMAL_WASM_MODULE).then(() => true, () => false);
  return wasmCompileAllowed;
}

const PBKDF2_PREFIX = "pbkdf2$";
// Workers hard-caps PBKDF2 at 100,000 iterations - this only ever protects a
// single publicly-known demo password on a read-only instance, so the cap is
// an acceptable tradeoff rather than something worth working around.
const PBKDF2_ITERATIONS = 100_000;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function pbkdf2Hash(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  if (await canCompileWasm()) {
    return argon2id({ password, salt, parallelism: 1, iterations: 3, memorySize: 19_456, hashLength: 32, outputType: "encoded" });
  }
  const hash = await pbkdf2Hash(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith(PBKDF2_PREFIX)) {
    const [, iterationsRaw, saltB64, hashB64] = hash.split("$");
    const iterations = Number(iterationsRaw);
    if (!iterations || !saltB64 || !hashB64) return false;
    const candidate = await pbkdf2Hash(password, fromBase64(saltB64), iterations);
    return toBase64(candidate) === hashB64;
  }
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}
