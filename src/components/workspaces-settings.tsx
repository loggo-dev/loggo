"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api, type AdminWorkspaceSummary } from "@/lib/api-client";
import { WorkspaceFormDialog, type WorkspaceFormValues } from "@/components/workspace-form-dialog";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { WorkspaceMembersDialog } from "@/components/workspace-members-dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function WorkspacesSettings() {
  const { user: currentUser } = useWorkspace();
  const queryClient = useQueryClient();
  const workspaces = useQuery({ queryKey: ["admin-workspaces"], queryFn: api.adminWorkspaces });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: api.adminUsers });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<AdminWorkspaceSummary | null>(null);
  const [membersWorkspace, setMembersWorkspace] = useState<AdminWorkspaceSummary | null>(null);

  const create = useMutation({
    mutationFn: (values: WorkspaceFormValues) => api.createWorkspace(values),
    onSuccess: () => {
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Workspace created");
    },
    onError: (error) => toast.error(error.message),
  });

  const members = useMutation({
    mutationFn: ({ workspaceId, memberIds }: { workspaceId: string; memberIds: string[] }) => api.setWorkspaceMembers(workspaceId, memberIds),
    onSuccess: () => {
      setMembersWorkspace(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      toast.success("Members updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ workspaceId, values }: { workspaceId: string; values: WorkspaceFormValues }) => api.updateWorkspace(workspaceId, { name: values.name, color: values.color, icon: values.icon }),
    onSuccess: () => {
      setEditingWorkspace(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Workspace updated");
    },
    onError: (error) => toast.error(error.message),
  });

  return <>
    <Card>
      <CardHeader>
        <CardTitle>Workspaces</CardTitle>
        <CardDescription>Manage shared spaces and the people who can access them.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Workspace</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces.isLoading ? <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">Loading workspaces…</TableCell></TableRow> : null}
            {workspaces.data?.workspaces.map((entry) => <TableRow key={entry.workspace.id}>
              <TableCell className="pl-4"><div className="flex items-center gap-3"><WorkspaceIcon icon={entry.workspace.icon} color={entry.workspace.color} className="size-9 [&_svg]:size-4" /><div className="min-w-0"><p className="truncate font-medium">{entry.workspace.name}</p><p className="truncate text-xs text-muted-foreground">{entry.workspace.slug}</p></div></div></TableCell>
              <TableCell><Badge variant="secondary" className="capitalize">{entry.workspace.kind}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{entry.members.length}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${entry.workspace.name} actions`}><MoreHorizontalIcon /></Button>} />
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setEditingWorkspace(entry)}><PencilIcon />Edit</DropdownMenuItem>
                      <DropdownMenuItem disabled={entry.workspace.kind === "personal"} onClick={() => setMembersWorkspace(entry)}><UsersIcon />Manage members</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" onClick={() => setCreateOpen(true)}><PlusIcon data-icon="inline-start" />Create Workspace</Button>
      </CardFooter>
    </Card>

    {createOpen ? <WorkspaceFormDialog open onOpenChange={setCreateOpen} workspace={null} users={users.data?.users ?? []} currentUserId={currentUser.id} workspaceCount={workspaces.data?.workspaces.length ?? 0} pending={create.isPending} onSubmit={(values) => create.mutate(values)} /> : null}
    {editingWorkspace ? <WorkspaceFormDialog open onOpenChange={(open) => { if (!open) setEditingWorkspace(null); }} workspace={editingWorkspace} users={users.data?.users ?? []} currentUserId={currentUser.id} workspaceCount={workspaces.data?.workspaces.length ?? 0} pending={update.isPending} onSubmit={(values) => update.mutate({ workspaceId: editingWorkspace.workspace.id, values })} /> : null}
    {membersWorkspace ? <WorkspaceMembersDialog open onOpenChange={(open) => { if (!open) setMembersWorkspace(null); }} workspace={membersWorkspace} users={users.data?.users ?? []} pending={members.isPending} onSubmit={(memberIds) => members.mutate({ workspaceId: membersWorkspace.workspace.id, memberIds })} /> : null}
  </>;
}
