"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { DEMO_MODE } from "@/lib/demo-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "setup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(DEMO_MODE && mode === "login" ? "demo@loggo.dev" : "");
  const [password, setPassword] = useState(DEMO_MODE && mode === "login" ? "demo@loggo.dev" : "");
  const status = useQuery({ queryKey: ["setup-status"], queryFn: api.setupStatus });
  useEffect(() => { if (status.data?.needed && mode === "login") router.replace("/setup"); if (status.data && !status.data.needed && mode === "setup") router.replace("/login"); }, [status.data, mode, router]);
  const mutation = useMutation({ mutationFn: () => mode === "setup" ? api.setup({ name, email, password }) : api.login({ email, password }), onSuccess: () => router.replace(`/d/${new Date().toISOString().slice(0, 10)}`) });
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate(); };
  return <main className="flex min-h-svh items-center justify-center p-5"><div className="flex w-full max-w-sm flex-col gap-6">
    <div className="flex items-center justify-center gap-2 text-lg font-semibold"><Image src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-lg" priority />Loggo</div>
    <Card><CardHeader><CardTitle>{mode === "setup" ? "Set up Loggo" : "Welcome back"}</CardTitle><CardDescription>{mode === "setup" ? "Create the first admin account. Your Personal workspace is created with it." : "Sign in to your workspace."}</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit}><FieldGroup>
        {mode === "setup" ? <Field><FieldLabel htmlFor="name">Name</FieldLabel><Input id="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></Field> : null}
        <Field><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></Field>
        <Field><FieldLabel htmlFor="password">Password</FieldLabel><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "setup" ? "new-password" : "current-password"} minLength={mode === "setup" ? 8 : undefined} required /></Field>
        {mutation.error ? <FieldError>{mutation.error.message}</FieldError> : null}
        <Field><Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : null}{mode === "setup" ? "Create admin" : "Sign in"}</Button></Field>
      </FieldGroup></form></CardContent>
    </Card>
  </div></main>;
}
