"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, FilterIcon, XIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type TaskStatus = "pending" | "completed";

export function TaskFilterMenu({ status, onStatusChange, from, to, onFromChange, onToChange }: {
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  const date: DateRange | undefined = (from || to) ? { from: from ? parseISO(from) : undefined, to: to ? parseISO(to) : undefined } : undefined;
  const hasDateRange = Boolean(from || to);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <FilterIcon data-icon="inline-start" />
        Filter
        {hasDateRange ? <Badge variant="secondary" className="ml-1 px-1.5">1</Badge> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-1">Status</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={status} onValueChange={(value) => onStatusChange(value as TaskStatus)}>
            <DropdownMenuRadioItem value="pending" closeOnClick={false}>Pending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="completed" closeOnClick={false}>Completed</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
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
