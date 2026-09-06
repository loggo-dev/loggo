import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: { default: "Loggo", template: "%s · Loggo" },
  description: "A self-hosted note app for engineers.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const htmlClassName = `h-full antialiased ${themeCookie === "dark" ? "dark" : ""}`.trim();

  return (
    <html 
      lang="en" 
      className={htmlClassName} 
      style={themeCookie === "dark" || themeCookie === "light" ? { colorScheme: themeCookie } : undefined}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
