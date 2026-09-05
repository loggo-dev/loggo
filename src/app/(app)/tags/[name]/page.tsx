import { LogsView } from "@/components/logs-view";
export default async function TagPage({ params }: { params: Promise<{ name: string }> }) { return <LogsView initialTag={decodeURIComponent((await params).name)} />; }
