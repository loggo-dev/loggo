import type { Metadata } from "next";
import { TemplateSettings } from "@/components/template-settings";

export const metadata: Metadata = { title: "Templates" };
export default function TemplatesPage() { return <TemplateSettings />; }
