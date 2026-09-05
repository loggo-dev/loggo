import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";
  return <AppShell defaultSidebarOpen={sidebarOpen}>{children}</AppShell>;
}
