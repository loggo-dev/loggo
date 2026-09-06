import type { WorkspaceColor, WorkspaceIconName } from "@/lib/workspace-appearance";

// The canned demo dataset: a small "infra team" with a personal workspace
// plus two shared ones. dayOffset on logs is relative to "today" at seed
// time (0 = today, -1 = yesterday) - see demo-seed.ts, which is what keeps
// this content from going stale as real calendar days pass.
export const DEMO_EMAIL = "demo@loggo.dev";
export const DEMO_PASSWORD = "demo@loggo.dev";

export type DemoUserKey = "demo" | "priya" | "marcus" | "elena";

export type DemoUser = { key: DemoUserKey; name: string; email: string; role: "admin" | "user" };

// The signed-in user (Demo) is the only admin - everyone else is a normal
// teammate whose only job is to show up as a log author and workspace member.
export const DEMO_USERS: DemoUser[] = [
  { key: "demo", name: "Demo", email: DEMO_EMAIL, role: "admin" },
  { key: "priya", name: "Priya Nair", email: "priya@loggo.dev", role: "user" },
  { key: "marcus", name: "Marcus Webb", email: "marcus@loggo.dev", role: "user" },
  { key: "elena", name: "Elena Vance", email: "elena@loggo.dev", role: "user" },
];

export type DemoWorkspaceKey = "platform" | "incidents";

export type DemoWorkspace = { key: DemoWorkspaceKey; name: string; icon: WorkspaceIconName; color: WorkspaceColor; members: DemoUserKey[] };

// The personal workspace is created separately (createPersonalWorkspace), so
// only the shared ones are listed here.
export const DEMO_WORKSPACES: DemoWorkspace[] = [
  { key: "platform", name: "Platform Team", icon: "server", color: "bg-violet-500", members: ["demo", "priya", "marcus", "elena"] },
  { key: "incidents", name: "On-Call & Incidents", icon: "cloud", color: "bg-rose-500", members: ["demo", "priya", "elena"] },
];

// A remote example image fetched at seed time and stored as a real
// attachment, so the demo shows what a Log with an image attached looks
// like. `url` points at picsum.photos's seeded endpoint, which always
// returns the same photo for a given seed - keeps the demo reproducible
// instead of showing a different random photo on every reseed.
export type DemoAttachment = { url: string; filename: string; alt: string };

export type DemoLog = {
  workspace: "personal" | DemoWorkspaceKey;
  author: DemoUserKey;
  dayOffset: 0 | -1;
  title?: string;
  body: string;
  posX: number;
  posY: number;
  attachment?: DemoAttachment;
};

export const DEMO_LOGS: DemoLog[] = [
  // --- Personal / today ---
  {
    workspace: "personal", author: "demo", dayOffset: 0,
    title: "Welcome to Loggo",
    body: "Loggo is a self-hosted note app for engineers. Drop **Logs** onto the day board as you work.\n\nTry `#tags`, `- [ ]` tasks, and fenced code blocks — each renders a little differently on its card. Switch workspaces from the sidebar to see how a platform team might use this.",
    posX: 24, posY: 24,
  },
  {
    workspace: "personal", author: "demo", dayOffset: 0,
    body: "- [ ] Ship the release notes !tomorrow\n- [x] Review the pull request\n- [ ] Reply to the customer thread !today",
    posX: 344, posY: 24,
  },
  {
    workspace: "personal", author: "demo", dayOffset: 0,
    body: "```ts\nexport function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n```",
    posX: 24, posY: 280,
  },

  // --- Personal / yesterday ---
  {
    workspace: "personal", author: "demo", dayOffset: -1,
    title: "Postgres tuning notes",
    body: "Bumped `work_mem` and re-ran the slow query report. Down from 4.2s to 380ms. #postgres #perf",
    posX: 24, posY: 24,
  },
  {
    workspace: "personal", author: "demo", dayOffset: -1,
    title: "Oncall handoff — week 36",
    body: "Quiet week. Two pages, both auto-resolved before I picked up. Handing off the pager to Priya at standup. #oncall",
    posX: 344, posY: 24,
  },

  // --- Platform Team / today ---
  {
    workspace: "platform", author: "elena", dayOffset: 0,
    title: "Platform sync — Sep 5",
    body: "**Attendees:** Elena, Priya, Marcus, Demo\n\n**Notes**\n- Cluster upgrade is go for this weekend, Marcus driving\n- Grafana noise is back on the agenda — Priya has a proposal\n- New hire starts Monday, needs AWS + kubectl access\n\n**Decisions**\n- Freeze non-critical merges Fri 6pm–Mon 9am during the upgrade\n\n#meeting",
    posX: 24, posY: 24,
  },
  {
    workspace: "platform", author: "marcus", dayOffset: 0,
    title: "Kubernetes 1.29 upgrade checklist",
    body: "- [x] Snapshot etcd\n- [x] Upgrade staging control plane\n- [ ] Soak staging for 24h !tomorrow\n- [ ] Upgrade prod control plane !saturday\n- [ ] Roll node pools one AZ at a time\n- [ ] Post upgrade summary in #platform\n\n#kubernetes",
    posX: 344, posY: 24,
  },
  {
    workspace: "platform", author: "priya", dayOffset: 0,
    title: "Grafana alert noise cleanup",
    body: "Audited last 30 days of pages. 62% came from 3 flapping disk-space alerts on the log shippers.\n\nProposal: raise threshold to 90%, add a 10m `for:` window before it fires. #observability #grafana",
    posX: 664, posY: 24,
    attachment: { url: "https://picsum.photos/seed/grafana-noise/900/540", filename: "alert-frequency.jpg", alt: "Alert frequency dashboard" },
  },
  {
    workspace: "platform", author: "demo", dayOffset: 0,
    title: "Runbook: restart the ingest workers",
    body: "```bash\nkubectl -n ingest rollout restart deployment/log-worker\nkubectl -n ingest rollout status deployment/log-worker --timeout=120s\n```\n\nUse this if the queue depth alert fires and lag isn't recovering on its own. #runbook",
    posX: 24, posY: 280,
  },

  // --- Platform Team / yesterday ---
  {
    workspace: "platform", author: "marcus", dayOffset: -1,
    title: "Terraform apply: bump RDS instance class",
    body: "Moved the primary from `db.r6g.xlarge` to `db.r6g.2xlarge` ahead of the upgrade — CPU was pinned during peak hours.\n\n```\n# terraform plan\n~ instance_class = \"db.r6g.xlarge\" -> \"db.r6g.2xlarge\"\nApply complete! Resources: 1 changed.\n```\n\n#terraform #aws #postgres",
    posX: 24, posY: 24,
  },
  {
    workspace: "platform", author: "elena", dayOffset: -1,
    title: "Capacity planning — Q3 review",
    body: "Storage growth is ~9% MoM, ahead of the 6% we budgeted for. Mostly log retention on the ingest cluster.\n\nAction: shorten hot-tier retention from 30d to 21d, archive the rest to R2. #capacity",
    posX: 344, posY: 24,
    attachment: { url: "https://picsum.photos/seed/capacity-q3/900/540", filename: "storage-growth-chart.jpg", alt: "Storage growth chart" },
  },
  {
    workspace: "platform", author: "priya", dayOffset: -1,
    title: "Incident retro: 2026-09-04 API 500s",
    body: "**Root cause:** connection pool exhaustion after a slow migration held locks for 90s.\n\n**Fix:** migration now runs with `lock_timeout` set, and we added a pool-usage alert at 80%.\n\n#incident #postgres #retro",
    posX: 664, posY: 24,
  },

  // --- On-Call & Incidents / today ---
  {
    workspace: "incidents", author: "priya", dayOffset: 0,
    title: "INC-482: API latency spike",
    body: "**Status:** monitoring\n\n- 09:14 p95 latency crossed 2s, paged on-call\n- 09:19 traced to a noisy neighbor pod on shared node\n- 09:26 cordoned the node, rescheduled pods\n- 09:41 latency back under 300ms\n\nWatching for recurrence before closing. #incident #oncall #p2",
    posX: 24, posY: 24,
    attachment: { url: "https://picsum.photos/seed/inc482-latency/900/540", filename: "p95-latency-graph.jpg", alt: "p95 latency graph" },
  },
  {
    workspace: "incidents", author: "demo", dayOffset: 0,
    title: "Post-incident action items",
    body: "- [ ] Add pod anti-affinity for noisy workloads !today\n- [ ] Set resource limits on the batch job that spiked !tomorrow\n- [ ] Write up INC-482 retro !friday",
    posX: 344, posY: 24,
  },
  {
    workspace: "incidents", author: "elena", dayOffset: 0,
    title: "Escalation contacts",
    body: "- Primary on-call: check PagerDuty schedule \"platform-primary\"\n- DB escalation: Marcus (secondary: Priya)\n- Cloud provider support: Enterprise line, account ID in 1Password\n- Status page updates: Elena or Demo only",
    posX: 664, posY: 24,
  },

  // --- On-Call & Incidents / yesterday ---
  {
    workspace: "incidents", author: "priya", dayOffset: -1,
    title: "Oncall handoff notes",
    body: "Picking up the pager today. Open items from Marcus's shift:\n- Disk-space alert on log-shipper-3, not urgent, ticket filed\n- Watching the RDS CPU after yesterday's resize\n\n#oncall",
    posX: 24, posY: 24,
  },
  {
    workspace: "incidents", author: "elena", dayOffset: -1,
    title: "Alert tuning: reduce PagerDuty noise",
    body: "Merged 4 near-duplicate alert rules into one with a shared dedup key. Should cut duplicate pages roughly in half. #pagerduty #oncall",
    posX: 344, posY: 24,
  },
];
