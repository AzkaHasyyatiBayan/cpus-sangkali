"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={id}
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      startMonth={new Date(2020, 0)}
      endMonth={new Date(2030, 11)}
      className={cn("p-3", className)}
      classNames={{
        months:
          "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption_label: "hidden", // disembunyikan, karena sudah pakai dropdown
        nav: "hidden", // styling navigasi pakai CSS global
        weekdays: "flex",
        weekday:
          "text-emerald-600 rounded-md w-9 font-normal text-[0.8rem]",
        weeks: "w-full border-collapse space-y-1",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 border border-transparent hover:bg-emerald-100"
        ),
        selected:
          "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus:bg-emerald-600 focus:text-white",
        today: "bg-emerald-100 text-emerald-800 border-emerald-300",
        outside:
          "text-slate-400 opacity-50 aria-selected:bg-emerald-50/50 aria-selected:text-slate-400 aria-selected:opacity-30",
        disabled: "text-slate-400 opacity-50",
        range_middle:
          "aria-selected:bg-emerald-50 aria-selected:text-emerald-800",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };