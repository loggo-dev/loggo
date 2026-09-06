"use client";

import { useState } from "react";
import type { TemplateSummary } from "@/lib/api-client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { LogEditor } from "@/components/log-editor";

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateSummary | null;
  pending: boolean;
  onSubmit: (values: { title: string | null; body: string; enabled: boolean }) => void;
}) {
  const [enabled, setEnabled] = useState(template?.enabled ?? true);
  
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>Modify the content of your template.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-6">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <div className="flex items-center gap-2 mt-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <span className="text-sm font-medium">{enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">When disabled, this template will not be applied to empty days.</p>
          </Field>
          
          <div className="border rounded-lg shadow-sm">
            <LogEditor 
              initialTitle={template.title ?? ""} 
              initialBody={template.body} 
              saving={pending}
              onSave={(values) => onSubmit({ ...values, enabled })}
              onSubmit={(values) => onSubmit({ ...values, enabled })}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
