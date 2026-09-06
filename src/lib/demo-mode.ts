// Set on the public Cloudflare demo build only (see package.json's
// build:workers script) - never on self-hosted deployments. NEXT_PUBLIC_ so
// client code (prefilling the demo login) reads the same build-time-inlined
// value.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
