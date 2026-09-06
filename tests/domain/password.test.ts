import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// hashPassword/verifyPassword cache their WebAssembly-compile-capability
// check at module scope, so each test needs a fresh module instance to
// observe the branch it's actually exercising (argon2 vs the Workers PBKDF2
// fallback) instead of whatever an earlier test already decided and cached.
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("Password hashing", () => {
  it("argon2 (default runtime): round-trips and rejects the wrong password", async () => {
    const { hashPassword, verifyPassword } = await import("@/server/domain/password");
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("falls back to PBKDF2 when WebAssembly can't be compiled (Cloudflare Workers) and still round-trips", async () => {
    vi.stubGlobal("WebAssembly", { ...WebAssembly, compile: () => Promise.reject(new Error("Wasm code generation disallowed by embedder")) });
    const { hashPassword, verifyPassword } = await import("@/server/domain/password");
    const hash = await hashPassword("demo@loggo.dev");

    expect(hash).toMatch(/^pbkdf2\$100000\$/);
    expect(await verifyPassword("demo@loggo.dev", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("rejects a malformed pbkdf2 hash instead of throwing", async () => {
    const { verifyPassword } = await import("@/server/domain/password");
    expect(await verifyPassword("anything", "pbkdf2$not-a-number$c2FsdA==$aGFzaA==")).toBe(false);
  });

  it("rejects a malformed argon2 hash instead of throwing", async () => {
    const { verifyPassword } = await import("@/server/domain/password");
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false);
  });
});
