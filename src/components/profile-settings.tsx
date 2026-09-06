"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { UserAvatar } from "@/components/user-avatar";
import { UserColorPicker } from "@/components/user-color-picker";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ProfileSettings() {
  const { user } = useWorkspace();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [color, setColor] = useState(user.color);
  const [password, setPassword] = useState("");
  const mutation = useMutation({ mutationFn: () => api.updateProfile({ name, color, ...(password ? { password } : {}) }), onSuccess: () => { setPassword(""); void queryClient.invalidateQueries({ queryKey: ["me"] }); toast.success("Profile saved"); }, onError: (error) => toast.error(error.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate(); };
  return <form onSubmit={submit} className="grid max-w-5xl items-start gap-5 md:grid-cols-2 lg:gap-8"><Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Your name and avatar color.</CardDescription></CardHeader><CardContent><FieldGroup><Field><FieldLabel>Avatar</FieldLabel><div className="flex items-center gap-4"><UserAvatar name={name} color={color} className="size-10" /><UserColorPicker value={color} onValueChange={setColor} /></div></Field><Field><FieldLabel htmlFor="display-name">Display name</FieldLabel><Input id="display-name" value={name} onChange={(event) => setName(event.target.value)} required /></Field><Field><FieldLabel>Email</FieldLabel><Input value={user.email} disabled /><FieldDescription>Email changes are managed by an admin.</FieldDescription></Field></FieldGroup></CardContent></Card>
    <Card><CardHeader><CardTitle>Password</CardTitle><CardDescription>Leave this empty to keep your current password.</CardDescription></CardHeader><CardContent><Field><FieldLabel htmlFor="new-password">New password</FieldLabel><Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" /></Field></CardContent><CardFooter className="justify-end"><Button type="submit" disabled={mutation.isPending}>Save changes</Button></CardFooter></Card>
  </form>;
}
