import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DayBoard } from "@/components/day-board";

export const metadata: Metadata = { title: "Day" };
export default async function DayPage({ params, searchParams }: { params: Promise<{ date: string }>; searchParams: Promise<{ new?: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  return <DayBoard date={date} autoNew={(await searchParams).new === "1"} />;
}
