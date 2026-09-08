"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDaysIcon, CheckSquare2Icon, ChevronsUpDownIcon, FileIcon, HashIcon, LogOutIcon, NotebookTabsIcon, PlusIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { SearchTrigger } from "@/components/search-trigger";
import { UserAvatar } from "@/components/user-avatar";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { useWorkspace } from "@/components/workspace-provider";
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
  const { isMobile, setOpenMobile } = useSidebar();
  const { user, workspaces, workspace, setWorkspaceId } = useWorkspace();
  const selectedDate = pathname.match(/^\/d\/(\d{4}-\d{2}-\d{2})/)?.[1];
  const logout = useMutation({ mutationFn: api.logout, onSuccess: () => { queryClient.clear(); router.replace("/login"); } });
  const switchWorkspace = (id: string) => { setWorkspaceId(id); void queryClient.invalidateQueries(); };
  // The nav links live in a Sheet on mobile - a route change alone doesn't
  // dismiss it (it's not a real navigation away from the page), so anything
  // that picks a destination has to close it explicitly.
  const closeMobileSidebar = () => { if (isMobile) setOpenMobile(false); };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar collapsible="none" className="relative h-auto w-full shrink-0 border-b border-sidebar-border transition-[width] duration-200 ease-linear md:h-full md:w-52! md:border-r md:border-b-0 group-data-[collapsible=icon]:md:w-12!">
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
                    {workspaces.map((candidate, index) => <DropdownMenuItem key={candidate.id} onClick={() => { switchWorkspace(candidate.id); closeMobileSidebar(); }} className="gap-2 p-2"><WorkspaceIcon icon={candidate.icon} color={candidate.color} className="size-6 rounded-md [&_svg]:size-3.5" />{candidate.name}<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut></DropdownMenuItem>)}
                  </DropdownMenuGroup>
                  {user.role === "admin" ? <><DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuItem onClick={() => { router.push("/settings/workspaces"); closeMobileSidebar(); }} className="gap-2 p-2"><div className="flex size-6 items-center justify-center rounded-md border bg-transparent"><PlusIcon /></div><div className="font-medium text-muted-foreground">Add workspace</div></DropdownMenuItem></DropdownMenuGroup></> : null}
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
                  return <SidebarMenuItem key={item.label}><SidebarMenuButton render={<Link href={href} onClick={closeMobileSidebar} />} isActive={active} tooltip={item.label} className="[&_svg]:size-5! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"><item.icon /><span className="group-data-[collapsible=icon]:hidden">{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
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
                  <DropdownMenuGroup><DropdownMenuItem onClick={() => { router.push("/settings"); closeMobileSidebar(); }}><SettingsIcon />Settings</DropdownMenuItem></DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout.mutate()}><LogOutIcon />Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {showSecondarySidebar ? <Sidebar collapsible="none" className="flex flex-1 border-r-0" data-state={calendarOpen || isMobile ? "expanded" : "collapsed"}>
        {calendarOpen || isMobile ? <>
          <SidebarHeader className="hidden gap-3 p-4 md:flex">
            <SearchTrigger onClick={closeMobileSidebar} />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <Calendar mode="single" selected={selectedDate ? new Date(`${selectedDate}T12:00:00`) : undefined} onSelect={(date) => { if (date) { router.push(`/d/${format(date, "yyyy-MM-dd")}`); closeMobileSidebar(); } }} className="w-full bg-transparent p-0 px-2 [--cell-size:--spacing(8)]" />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </> : null}
        <SidebarRail onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCalendar(); }} />
      </Sidebar> : null}
    </Sidebar>
  );
}
