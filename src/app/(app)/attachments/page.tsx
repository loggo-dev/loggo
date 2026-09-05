import type { Metadata } from "next";
import { AttachmentsView } from "@/components/attachments-view";
export const metadata: Metadata = { title: "Attachments" };
export default function AttachmentsPage() { return <AttachmentsView />; }
