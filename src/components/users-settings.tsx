"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api, type UserSummary } from "@/lib/api-client";
import { UserAvatar } from "@/components/user-avatar";
import { UserFormDialog, type UserFormValues } from "@/components/user-form-dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function UsersSettings() {
  const { user: currentUser } = useWorkspace();
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users"], queryFn: api.adminUsers });
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);

  const refreshUsers = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const create = useMutation({
    mutationFn: (values: UserFormValues) => api.createUser(values),
    onSuccess: () => {
      setCreateOpen(false);
      refreshUsers();
      toast.success("User created");
    },
    onError: (error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Parameters<typeof api.updateUser>[1] }) => api.updateUser(id, values),
    onSuccess: () => {
      setEditingUser(null);
      refreshUsers();
      toast.success("User updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateFromDialog = (values: UserFormValues) => {
    if (!editingUser) return;
    update.mutate({
      id: editingUser.id,
      values: {
        name: values.name,
        role: values.role,
        color: values.color,
        ...(values.password ? { password: values.password } : {}),
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage the people who can access this Loggo instance.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isLoading ? <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">Loading users…</TableCell></TableRow> : null}
              {users.data?.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} color={user.color} className="size-9" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><span className="truncate font-medium">{user.name}</span>{user.id === currentUser.id ? <Badge variant="outline">You</Badge> : null}</div>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{user.role}</Badge></TableCell>
                  <TableCell>{user.disabledAt ? <Badge variant="outline">Disabled</Badge> : <Badge variant="secondary">Active</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground">{user.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(user.createdAt)) : "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${user.name} actions`}><MoreHorizontalIcon /></Button>} />
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setEditingUser(user)}><PencilIcon />Edit</DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem disabled={user.id === currentUser.id} onClick={() => update.mutate({ id: user.id, values: { disabled: !user.disabledAt } })}>
                            {user.disabledAt ? <UserCheckIcon /> : <UserXIcon />}{user.disabledAt ? "Enable" : "Disable"}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline" onClick={() => setCreateOpen(true)}><PlusIcon data-icon="inline-start" />Create User</Button>
        </CardFooter>
      </Card>

      {createOpen ? <UserFormDialog open onOpenChange={setCreateOpen} user={null} userCount={users.data?.users.length ?? 0} pending={create.isPending} onSubmit={(values) => create.mutate(values)} /> : null}
      {editingUser ? <UserFormDialog open onOpenChange={(open) => { if (!open) setEditingUser(null); }} user={editingUser} userCount={users.data?.users.length ?? 0} pending={update.isPending} onSubmit={updateFromDialog} /> : null}
    </>
  );
}
