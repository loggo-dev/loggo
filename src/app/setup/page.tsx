import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Set up" };
export default function SetupPage() { return <AuthForm mode="setup" />; }
