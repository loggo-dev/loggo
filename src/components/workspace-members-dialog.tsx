"use client";

import { useMemo, useState } from "react";
import type { AdminWorkspaceSummary, UserSummary } from "@/lib/api-client";
import { UserAvatar } from "@/components/user-avatar";
import { AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function WorkspaceMembersDialog({ open, onOpenChange, workspace, users, pending, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: AdminWorkspaceSummary;
  users: UserSummary[];
  pending: boolean;
  onSubmit: (memberIds: string[]) => void;
}) {
  const ownerIds = useMemo(() => new Set(workspace.members.filter((member) => member.role === "owner").map((member) => member.userId)), [workspace]);
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const [memberIds, setMemberIds] = useState<string[]>(() => workspace.members.map((member) => member.userId));

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Manage Workspace Members</DialogTitle><DialogDescription>Choose who can access {workspace.workspace.name}. The owner cannot be removed.</DialogDescription></DialogHeader>
      <Field>
        <FieldLabel>Members</FieldLabel>
        <Select multiple value={memberIds} onValueChange={(next) => setMemberIds(next)}>
          <SelectTrigger className="h-auto min-h-9 w-full py-1.5">
            <SelectValue placeholder="Select members">
              {(value: string[]) => value.length ? <span className="flex min-w-0 items-center gap-2">
                <AvatarGroup>
                  {value.slice(0, 5).map((id) => {
                    const user = usersById.get(id);
                    return user ? <UserAvatar key={id} name={user.name} color={user.color} className="size-6" /> : null;
                  })}
                </AvatarGroup>
                <span className="truncate text-muted-foreground">{value.length} member{value.length === 1 ? "" : "s"} selected</span>
              </span> : "Select members"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="min-w-(--anchor-width)">
            {users.map((user) => {
              const owner = ownerIds.has(user.id);
              return <SelectItem key={user.id} value={user.id} disabled={owner} label={user.name}>
                <UserAvatar name={user.name} color={user.color} className="size-7" />
                <div className="min-w-0">
                  <p className="truncate">{user.name}{owner ? " · Owner" : ""}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </SelectItem>;
            })}
          </SelectContent>
        </Select>
      </Field>
      <DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button onClick={() => onSubmit(memberIds)} disabled={pending}>Save members</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
