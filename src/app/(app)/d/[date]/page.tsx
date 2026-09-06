import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DayBoard } from "@/components/day-board";

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { title: "Day" };
  return { title: format(parseISO(date), "MMM d, yyyy") };
}

export default async function DayPage({ params, searchParams }: { params: Promise<{ date: string }>; searchParams: Promise<{ new?: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  return <DayBoard date={date} autoNew={(await searchParams).new === "1"} />;
}
