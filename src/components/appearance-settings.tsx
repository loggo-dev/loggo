"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const THEME_OPTIONS = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Loggo looks on this device.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <Field>
            <FieldLabel>Theme</FieldLabel>
            <Tabs value={theme} onValueChange={setTheme} className="w-fit">
              <TabsList>
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger key={value} value={value} className="flex gap-2">
                    <Icon className="size-4" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <FieldDescription>System follows your operating system setting.</FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
