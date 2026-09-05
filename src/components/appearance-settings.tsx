"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const THEME_OPTIONS = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Loggo looks on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <Field>
            <FieldLabel>Theme</FieldLabel>
            <RadioGroup value={theme} onValueChange={(value) => value && setTheme(value as string)} className="grid w-fit grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <FieldLabel key={value} htmlFor={`theme-${value}`}>
                  <Field orientation="horizontal">
                    <RadioGroupItem value={value} id={`theme-${value}`} />
                    <FieldContent><FieldTitle><Icon className="size-4" />{label}</FieldTitle></FieldContent>
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
            <FieldDescription>System follows your operating system setting.</FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
