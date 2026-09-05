import type { Metadata } from "next";
import { LogsView } from "@/components/logs-view";

export const metadata: Metadata = { title: "Logs" };
export default function LogsPage() { return <LogsView />; }
