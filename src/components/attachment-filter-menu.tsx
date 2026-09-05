"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, FileTypeIcon, FilterIcon, XIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AttachmentFilterMenu({ extension, onExtensionChange, extensions, from, to, onFromChange, onToChange }: {
  extension: string;
  onExtensionChange: (extension: string) => void;
  extensions?: string[];
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  const date: DateRange | undefined = (from || to) ? { from: from ? parseISO(from) : undefined, to: to ? parseISO(to) : undefined } : undefined;
  const hasDateRange = Boolean(from || to);
  const hasExtension = extension !== "all";
  const activeCount = (hasDateRange ? 1 : 0) + (hasExtension ? 1 : 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <FilterIcon data-icon="inline-start" />
        Filter
        {activeCount > 0 ? <Badge variant="secondary" className="ml-1 px-1.5">{activeCount}</Badge> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileTypeIcon />
            Extension
            {hasExtension ? <Badge variant="secondary" className="ml-auto px-1.5">1</Badge> : null}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 p-1">
            <DropdownMenuRadioGroup value={extension} onValueChange={(value) => onExtensionChange(value)}>
              <DropdownMenuRadioItem value="all" closeOnClick={false}>All extensions</DropdownMenuRadioItem>
              {extensions?.map((item) => <DropdownMenuRadioItem key={item} value={item} closeOnClick={false}>.{item}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CalendarIcon />
            Date range
            {hasDateRange ? <Badge variant="secondary" className="ml-auto px-1.5">1</Badge> : null}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto p-2">
            <div className="flex items-center justify-between px-1">
              <span className="px-1 text-xs font-medium text-muted-foreground">Date range</span>
              {hasDateRange ? <Button variant="ghost" size="icon-sm" onClick={() => { onFromChange(""); onToChange(""); }} aria-label="Clear date range"><XIcon className="size-3.5" /></Button> : null}
            </div>
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                onFromChange(newDate?.from ? format(newDate.from, "yyyy-MM-dd") : "");
                onToChange(newDate?.to ? format(newDate.to, "yyyy-MM-dd") : "");
              }}
              numberOfMonths={1}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
