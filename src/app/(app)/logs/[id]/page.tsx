import { LogDetailView } from "@/components/log-detail-view";

export default async function LogPage({ params }: { params: Promise<{ id: string }> }) { return <LogDetailView id={(await params).id} />; }
