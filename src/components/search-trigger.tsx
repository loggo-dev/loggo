"use client";

import { SearchIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export function SearchTrigger({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Button
      variant="outline"
      className={cn("justify-start bg-background/40", className)}
      onClick={() => { window.dispatchEvent(new Event("loggo:search")); onClick?.(); }}
    >
      <SearchIcon data-icon="inline-start" />
      <span>Search Logs</span>
      <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:block">⌘K</kbd>
    </Button>
  );
}
