"use client";

import { DatabaseIcon, MoonStarIcon, UserRoundIcon, UsersIcon, WarehouseIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui/button";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useWorkspace();
  const sections = [
    { label: "Basic", links: [
      { href: "/settings", label: "Profile", icon: UserRoundIcon, exact: true },
      { href: "/settings/appearance", label: "Appearance", icon: MoonStarIcon },
    ] },
    ...(user.role === "admin" ? [{ label: "Admin", links: [
      { href: "/settings/users", label: "Users", icon: UsersIcon },
      { href: "/settings/workspaces", label: "Workspaces", icon: WarehouseIcon },
      { href: "/settings/instance", label: "Instance", icon: DatabaseIcon },
    ] }] : []),
  ];
  return <main className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 py-7 md:grid-cols-[190px_minmax(0,1fr)] md:px-8 md:py-10">
    <nav aria-label="Settings" className="flex gap-5 overflow-x-auto md:flex-col">{sections.map((section) => <div key={section.label} className="flex shrink-0 flex-col gap-1"><p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{section.label}</p><div className="flex gap-1 md:flex-col">{section.links.map((item) => <Button key={item.href} variant={(item.exact ? pathname === item.href : pathname.startsWith(item.href)) ? "secondary" : "ghost"} className="justify-start" nativeButton={false} render={<Link href={item.href} />}><item.icon data-icon="inline-start" />{item.label}</Button>)}</div></div>)}</nav>
    <div className="min-w-0">{children}</div>
  </main>;
}
