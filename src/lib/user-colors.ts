export const USER_COLORS = [
  "bg-blue-500",
  "bg-fuchsia-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-orange-500",
] as const;

export type UserColor = (typeof USER_COLORS)[number];

export function nextUserColor(existingCount: number): UserColor {
  return USER_COLORS[existingCount % USER_COLORS.length];
}
