"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, TrashIcon, CheckIcon, XIcon, Calendar1Icon, CalendarDaysIcon } from "lucide-react";
import { api, type TemplateSummary } from "@/lib/api-client";
import { useWorkspace } from "@/components/workspace-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription, FieldContent, FieldTitle } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TemplateFormDialog } from "@/components/template-form-dialog";

export function TemplateSettings() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const templatesQuery = useQuery({ queryKey: ["templates", workspace.id], queryFn: () => api.templates(workspace.id) });

  const [editingTemplate, setEditingTemplate] = useState<TemplateSummary | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateSummary | null>(null);

  const create = useMutation({
    mutationFn: () => api.createTemplate(workspace.id, { title: "New Template", body: "- [ ] " }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["templates", workspace.id] });
      setEditingTemplate(data.template);
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTemplate(workspace.id, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates", workspace.id] })
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: { title: string | null; body: string; enabled: boolean } }) => api.updateTemplate(workspace.id, id, values),
    onSuccess: () => {
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["templates", workspace.id] });
      toast.success("Template updated");
    }
  });

  const setMode = useMutation({
    mutationFn: (mode: "today_only" | "any_visited_day") => api.updateTemplateMode(workspace.id, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Generation mode updated");
    }
  });

  const [mode, setModeState] = useState(workspace.templateMode ?? "today_only");

  if (!templatesQuery.data) return <Skeleton className="h-72 w-full max-w-3xl" />;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Generation Mode</CardTitle>
          <CardDescription>Choose when Daily Templates are automatically applied to empty days.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={(val: "today_only" | "any_visited_day") => { setModeState(val); setMode.mutate(val); }} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <label htmlFor="mode-today" className={`relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 ${mode === "today_only" ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="today_only" id="mode-today" className="sr-only" />
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${mode === "today_only" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Calendar1Icon className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Only for today</span>
                <span className="text-[11px] leading-tight text-muted-foreground">Trigger only for the current day.</span>
              </div>
            </label>

            <label htmlFor="mode-any" className={`relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/50 ${mode === "any_visited_day" ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="any_visited_day" id="mode-any" className="sr-only" />
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${mode === "any_visited_day" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <CalendarDaysIcon className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Any visited day</span>
                <span className="text-[11px] leading-tight text-muted-foreground">Trigger for any date you explicitly visit.</span>
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Manage daily templates for this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.isLoading ? <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">Loading templates…</TableCell></TableRow> : null}
              {templatesQuery.data.templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No templates created yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {templatesQuery.data.templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="pl-4 font-medium">{template.title || "Untitled"}</TableCell>
                  <TableCell>
                    {template.enabled ? <Badge variant="secondary">Enabled</Badge> : <Badge variant="outline">Disabled</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(template.createdAt))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Template actions`}><MoreHorizontalIcon /></Button>} />
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setEditingTemplate(template)}><PencilIcon />Edit</DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: template.id, values: { title: template.title, body: template.body, enabled: !template.enabled } })}>
                            {template.enabled ? <XIcon /> : <CheckIcon />}{template.enabled ? "Disable" : "Enable"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingTemplate(template)}>
                            <TrashIcon />Delete
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
          <Button variant="outline" onClick={() => create.mutate()} disabled={create.isPending}><PlusIcon data-icon="inline-start" />Add Template</Button>
        </CardFooter>
      </Card>

      {editingTemplate ? (
        <TemplateFormDialog 
          open 
          onOpenChange={(open) => { if (!open) setEditingTemplate(null); }} 
          template={editingTemplate} 
          pending={updateMutation.isPending} 
          onSubmit={(values) => updateMutation.mutate({ id: editingTemplate.id, values })} 
        />
      ) : null}

      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => { if (!open) setDeletingTemplate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? It will no longer be applied to empty days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deletingTemplate) {
                  remove.mutate(deletingTemplate.id, {
                    onSuccess: () => setDeletingTemplate(null)
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
