"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function DateRangeFilter({ from, to, onFromChange, onToChange }: { from: string; to: string; onFromChange: (val: string) => void; onToChange: (val: string) => void }) {
  const date: DateRange | undefined = (from || to) ? {
    from: from ? parseISO(from) : undefined,
    to: to ? parseISO(to) : undefined
  } : undefined;

  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          />}>
            <CalendarIcon data-icon="inline-start" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              if (newDate?.from) {
                onFromChange(format(newDate.from, "yyyy-MM-dd"));
              } else {
                onFromChange("");
              }
              if (newDate?.to) {
                onToChange(format(newDate.to, "yyyy-MM-dd"));
              } else {
                onToChange("");
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {(from || to) && (
        <Button variant="ghost" size="icon" onClick={() => { onFromChange(""); onToChange(""); }} aria-label="Clear dates">
          <XIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
