"use client";

import { FormEvent, useState } from "react";
import type { AdminWorkspaceSummary, UserSummary } from "@/lib/api-client";
import { DEFAULT_WORKSPACE_ICON, nextWorkspaceColor, type WorkspaceColor, type WorkspaceIconName } from "@/lib/workspace-appearance";
import { WorkspaceColorPicker, WorkspaceIconPicker } from "@/components/workspace-appearance-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type WorkspaceFormValues = { name: string; color: WorkspaceColor; icon: WorkspaceIconName; memberIds: string[] };

export function WorkspaceFormDialog({ open, onOpenChange, workspace, users, currentUserId, workspaceCount, pending, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: AdminWorkspaceSummary | null;
  users: UserSummary[];
  currentUserId: string;
  workspaceCount: number;
  pending: boolean;
  onSubmit: (values: WorkspaceFormValues) => void;
}) {
  const editing = workspace !== null;
  const [name, setName] = useState(workspace?.workspace.name ?? "");
  const [color, setColor] = useState<WorkspaceColor>(workspace?.workspace.color ?? nextWorkspaceColor(workspaceCount));
  const [icon, setIcon] = useState<WorkspaceIconName>(workspace?.workspace.icon ?? DEFAULT_WORKSPACE_ICON);
  const [memberIds, setMemberIds] = useState(() => new Set(editing ? workspace.members.map((member) => member.userId) : [currentUserId]));

  const toggleMember = (userId: string, checked: boolean) => {
    setMemberIds((current) => {
      const next = new Set(current);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color, icon, memberIds: [...memberIds] });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Workspace" : "Create Workspace"}</DialogTitle>
        <DialogDescription>{editing ? "Update this Workspace’s name, color, and icon." : "Create a shared Workspace and choose how it looks."}</DialogDescription>
      </DialogHeader>
      <form id="workspace-form" onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
            <div className="flex items-center gap-3"><WorkspaceIconPicker value={icon} color={color} onValueChange={setIcon} /><Input id="workspace-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus required maxLength={80} /></div>
          </Field>
          <Field><FieldLabel>Color</FieldLabel><WorkspaceColorPicker value={color} onValueChange={setColor} /></Field>
          {!editing ? <FieldSet>
            <FieldLegend variant="label">Members</FieldLegend>
            <FieldGroup data-slot="checkbox-group" className="max-h-48 overflow-y-auto rounded-lg border p-2">
              {users.map((user) => {
                const owner = user.id === currentUserId;
                return <FieldLabel key={user.id}>
                  <Field orientation="horizontal" data-disabled={owner || undefined}>
                    <Checkbox checked={memberIds.has(user.id)} disabled={owner} onCheckedChange={(checked) => toggleMember(user.id, checked === true)} />
                    <FieldContent><FieldTitle>{user.name}{owner ? " · Owner" : ""}</FieldTitle><FieldDescription>{user.email}</FieldDescription></FieldContent>
                  </Field>
                </FieldLabel>;
              })}
            </FieldGroup>
          </FieldSet> : null}
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" form="workspace-form" disabled={pending}>{editing ? "Save changes" : "Create Workspace"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
