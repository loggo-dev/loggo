"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, FileTextIcon, HashIcon, MoonStarIcon, PlusIcon, SearchIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useWorkspace } from "@/components/workspace-provider";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { workspace } = useWorkspace();
  const isAction = query.startsWith(">");
  const results = useQuery({ queryKey: ["search", workspace.id, deferred], queryFn: () => api.search(workspace.id, deferred), enabled: open && deferred.trim().length > 1 && !isAction });
  useEffect(() => { const show = () => setOpen(true); const keyboard = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); } }; window.addEventListener("loggo:search", show); window.addEventListener("keydown", keyboard); return () => { window.removeEventListener("loggo:search", show); window.removeEventListener("keydown", keyboard); }; }, []);
  const go = (href: string) => { setOpen(false); setQuery(""); router.push(href); };
  return <CommandDialog open={open} onOpenChange={setOpen} title="Search Loggo" description="Search Logs, tags, tasks, or run an action">
    <Command shouldFilter={isAction}>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search Logs, tags, and tasks…" />
      <CommandList>
        {!isAction && query.trim().length > 1 && !results.isLoading && !results.data?.results.length ? <CommandEmpty>No results found.</CommandEmpty> : null}
        {isAction ? <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(`/d/${new Date().toISOString().slice(0, 10)}?new=1`)}><PlusIcon />New Log<CommandShortcut>L</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => go(`/d/${new Date().toISOString().slice(0, 10)}`)}><CalendarIcon />Jump to today</CommandItem>
          <CommandItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{resolvedTheme === "dark" ? <SunIcon /> : <MoonStarIcon />}Toggle theme</CommandItem>
        </CommandGroup> : (["log", "tag", "task"] as const).map((type) => { const group = results.data?.results.filter((result) => result.type === type) ?? []; if (!group.length) return null; return <CommandGroup key={type} heading={`${type[0].toUpperCase()}${type.slice(1)}s`}>{group.map((result) => <CommandItem key={`${type}-${result.id}`} value={`${type}-${result.id}-${result.title}`} onSelect={() => go(type === "log" ? `/logs/${result.id}` : type === "tag" ? `/tags/${encodeURIComponent(result.title.slice(1))}` : "/tasks")} >{type === "tag" ? <HashIcon /> : <FileTextIcon />}<span className="truncate">{result.title}</span>{result.day ? <CommandShortcut>{result.day}</CommandShortcut> : null}</CommandItem>)}</CommandGroup>; })}
        {query.trim().length === 0 ? <CommandGroup heading="Tip"><CommandItem disabled><SearchIcon />Type &gt; to see actions</CommandItem></CommandGroup> : null}
      </CommandList>
    </Command>
  </CommandDialog>;
}
