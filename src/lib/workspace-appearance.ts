import { USER_COLORS } from "@/lib/user-colors";

export const WORKSPACE_COLORS = USER_COLORS;
export type WorkspaceColor = (typeof WORKSPACE_COLORS)[number];

export const WORKSPACE_ICONS = [
  "gallery",
  "users",
  "briefcase",
  "building",
  "rocket",
  "code",
  "terminal",
  "database",
  "server",
  "cloud",
  "package",
  "folder",
  "notebook",
  "book",
  "box",
  "lightbulb",
  "target",
  "sparkles",
  "palette",
  "globe",
] as const;

export type WorkspaceIconName = (typeof WORKSPACE_ICONS)[number];

export const DEFAULT_WORKSPACE_COLOR: WorkspaceColor = "bg-blue-500";
export const DEFAULT_WORKSPACE_ICON: WorkspaceIconName = "gallery";

export function isWorkspaceColor(value: unknown): value is WorkspaceColor {
  return typeof value === "string" && (WORKSPACE_COLORS as readonly string[]).includes(value);
}

export function isWorkspaceIcon(value: unknown): value is WorkspaceIconName {
  return typeof value === "string" && (WORKSPACE_ICONS as readonly string[]).includes(value);
}

export function nextWorkspaceColor(existingCount: number): WorkspaceColor {
  return WORKSPACE_COLORS[existingCount % WORKSPACE_COLORS.length];
}
