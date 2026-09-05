"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { AppLoadingSkeleton } from "@/components/app-loading-skeleton";
import { AppSidebar } from "@/components/app-sidebar";
import { SearchPalette } from "@/components/search-palette";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children, defaultSidebarOpen }: { children: React.ReactNode; defaultSidebarOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(true);
  const isSettings = pathname.startsWith("/settings");
  const showSecondarySidebar = !isSettings;
  const isCalendarVisible = showSecondarySidebar && calendarOpen;
  
  const me = useQuery({ queryKey: ["me"], queryFn: api.me });
  useEffect(() => { if (me.isError) router.replace("/login"); }, [me.isError, router]);
  if (!me.data) return <AppLoadingSkeleton showSecondarySidebar={showSecondarySidebar} sidebarOpen={defaultSidebarOpen} />;
  
  return <WorkspaceProvider user={me.data.user} workspaces={me.data.workspaces}>
    <SidebarProvider defaultOpen={defaultSidebarOpen} style={{ "--sidebar-width": isCalendarVisible ? "31.875rem" : "13rem", "--sidebar-width-icon": isCalendarVisible ? "21.875rem" : "3rem" } as React.CSSProperties}>
      <AppSidebar showSecondarySidebar={showSecondarySidebar} calendarOpen={calendarOpen} onToggleCalendar={() => setCalendarOpen(!calendarOpen)} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-12 items-center border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </SidebarInset>
      <SearchPalette />
    </SidebarProvider>
  </WorkspaceProvider>;
}
