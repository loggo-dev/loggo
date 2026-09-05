"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDaysIcon, CheckSquare2Icon, ChevronsUpDownIcon, FileIcon, HashIcon, LogOutIcon, NotebookTabsIcon, PlusIcon, SearchIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { UserAvatar } from "@/components/user-avatar";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "@/components/ui/sidebar";

const nav = [
  { label: "Today", href: () => `/d/${format(new Date(), "yyyy-MM-dd")}`, icon: CalendarDaysIcon },
  { label: "Logs", href: () => "/logs", icon: NotebookTabsIcon },
  { label: "Tasks", href: () => "/tasks", icon: CheckSquare2Icon },
  { label: "Tags", href: () => "/tags", icon: HashIcon },
  { label: "Attachments", href: () => "/attachments", icon: FileIcon },
];

export function AppSidebar({ showSecondarySidebar, calendarOpen, onToggleCalendar, ...props }: React.ComponentProps<typeof Sidebar> & { showSecondarySidebar: boolean; calendarOpen: boolean; onToggleCalendar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const { user, workspaces, workspace, setWorkspaceId } = useWorkspace();
  const selectedDate = pathname.match(/^\/d\/(\d{4}-\d{2}-\d{2})/)?.[1];
  const logout = useMutation({ mutationFn: api.logout, onSuccess: () => { queryClient.clear(); router.replace("/login"); } });
  const switchWorkspace = (id: string) => { setWorkspaceId(id); void queryClient.invalidateQueries(); };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar collapsible="none" className="relative w-52! shrink-0 border-r border-sidebar-border transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-12!">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground" />}>
                  <WorkspaceIcon icon={workspace.icon} color={workspace.color} className="size-8 [&_svg]:size-4" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{workspace.name}</span>
                    <span className="truncate text-xs">{workspace.kind === "personal" ? "Private workspace" : "Shared workspace"}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-fit" align="start" side={isMobile ? "bottom" : "right"} sideOffset={4}>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
                    {workspaces.map((candidate, index) => <DropdownMenuItem key={candidate.id} onClick={() => switchWorkspace(candidate.id)} className="gap-2 p-2"><WorkspaceIcon icon={candidate.icon} color={candidate.color} className="size-6 rounded-md [&_svg]:size-3.5" />{candidate.name}<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut></DropdownMenuItem>)}
                  </DropdownMenuGroup>
                  {user.role === "admin" ? <><DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuItem onClick={() => router.push("/settings/workspaces")} className="gap-2 p-2"><div className="flex size-6 items-center justify-center rounded-md border bg-transparent"><PlusIcon /></div><div className="font-medium text-muted-foreground">Add workspace</div></DropdownMenuItem></DropdownMenuGroup></> : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu className="gap-1">
                {nav.map((item) => {
                  const href = item.href();
                  const active = item.label === "Today" ? pathname === href : pathname.startsWith(href);
                  return <SidebarMenuItem key={item.label}><SidebarMenuButton render={<Link href={href} />} isActive={active} tooltip={item.label} className="[&_svg]:size-5! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"><item.icon /><span className="group-data-[collapsible=icon]:hidden">{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground" />}>
                  <UserAvatar name={user.name} color={user.color} className="size-8 rounded-lg" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
                  <DropdownMenuGroup><DropdownMenuLabel className="p-0 font-normal"><div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm"><UserAvatar name={user.name} color={user.color} className="size-8 rounded-lg" /><div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{user.name}</span><span className="truncate text-xs">{user.email}</span></div></div></DropdownMenuLabel></DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup><DropdownMenuItem onClick={() => router.push("/settings")}><SettingsIcon />Settings</DropdownMenuItem></DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout.mutate()}><LogOutIcon />Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {showSecondarySidebar ? <Sidebar collapsible="none" className="hidden flex-1 border-r-0 md:flex" data-state={calendarOpen ? "expanded" : "collapsed"}>
        {calendarOpen ? <>
          <SidebarHeader className="gap-3 border-b border-sidebar-border p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{workspace.name}</p>
              <p className="truncate text-xs text-muted-foreground">{workspace.kind === "personal" ? "Private workspace" : "Shared workspace"}</p>
            </div>
            <Button variant="outline" className="justify-start bg-background/40" onClick={() => window.dispatchEvent(new Event("loggo:search"))}><SearchIcon data-icon="inline-start" /><span>Search Logs</span><kbd className="ml-auto hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:block">⌘K</kbd></Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <Calendar mode="single" selected={selectedDate ? new Date(`${selectedDate}T12:00:00`) : undefined} onSelect={(date) => date && router.push(`/d/${format(date, "yyyy-MM-dd")}`)} className="w-full bg-transparent p-0 px-2 [--cell-size:--spacing(8)]" />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </> : null}
        <SidebarRail onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCalendar(); }} />
      </Sidebar> : null}
    </Sidebar>
  );
}
