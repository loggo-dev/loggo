"use client";

import { FormEvent, useState } from "react";
import type { UserSummary } from "@/lib/api-client";
import { nextUserColor, type UserColor } from "@/lib/user-colors";
import { UserAvatar } from "@/components/user-avatar";
import { UserColorPicker } from "@/components/user-color-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  color: UserColor;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  userCount,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserSummary | null;
  userCount: number;
  pending: boolean;
  onSubmit: (values: UserFormValues) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [role, setRole] = useState<"admin" | "user">(user?.role ?? "user");
  const [color, setColor] = useState<UserColor>(user?.color ?? nextUserColor(userCount));
  const editing = user !== null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Passwords don’t match.");
      return;
    }
    setPasswordError("");
    onSubmit({ name, email, password, role, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>{editing ? "Update this user’s profile and access." : "Create an account for someone on this Loggo instance."}</DialogDescription>
        </DialogHeader>
        <form id="user-form" onSubmit={submit}>
          <FieldGroup className="grid sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="user-name">Name</FieldLabel>
              <Input id="user-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input id="user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={editing} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-password">{editing ? "New password" : "Temporary password"}</FieldLabel>
              <Input id="user-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(""); }} minLength={8} required={!editing} autoComplete="new-password" aria-invalid={passwordError ? true : undefined} />
            </Field>
            <Field data-invalid={passwordError ? true : undefined}>
              <FieldLabel htmlFor="confirm-user-password">Confirm password</FieldLabel>
              <Input id="confirm-user-password" type="password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setPasswordError(""); }} minLength={8} required={!editing || Boolean(password)} autoComplete="new-password" aria-invalid={passwordError ? true : undefined} />
              {passwordError ? <FieldError>{passwordError}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={role} onValueChange={(value) => value && setRole(value as "admin" | "user")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectGroup></SelectContent>
              </Select>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Avatar</FieldLabel>
              <div className="flex items-center gap-4">
                <UserAvatar name={name} color={color} className="size-10" />
                <UserColorPicker value={color} onValueChange={setColor} />
              </div>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button type="submit" form="user-form" disabled={pending}>{editing ? "Save changes" : "Create User"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
