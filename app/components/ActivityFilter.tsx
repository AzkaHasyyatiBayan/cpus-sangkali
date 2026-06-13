"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Search, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { cn } from "@/lib/utils";

interface ActivityFilterProps {
  onFilterChange: (title: string, date: string) => void;
}

export default function ActivityFilter({
  onFilterChange,
}: ActivityFilterProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  // Fetch available titles for autocomplete
  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const res = await fetch("/api/activities/titles");
        const data = await res.json();
        if (data.success) {
          setAvailableTitles(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch titles:", error);
      }
    };
    fetchTitles();
  }, []);

  // Apply filters
  useEffect(() => {
    const dateStr = date ? format(date, "yyyy-MM-dd") : "";
    onFilterChange(title, dateStr);
  }, [title, date, onFilterChange]);

  const clearFilters = useCallback(() => {
    setTitle("");
    setDate(undefined);
  }, []);

  const hasActiveFilters = title || date;

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-medium text-emerald-800">
            Filter Kegiatan
          </h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 h-7"
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Title Combobox */}
        <div className="flex-1">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between text-left font-normal border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  {title || (
                    <span className="text-slate-400">
                      Cari judul kegiatan...
                    </span>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-75 p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Ketik judul kegiatan..."
                  value={title}
                  onValueChange={setTitle}
                />
                <CommandList>
                  <CommandEmpty>Tidak ada judul ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {availableTitles
                      .filter((t) =>
                        t.toLowerCase().includes(title.toLowerCase())
                      )
                      .map((t) => (
                        <CommandItem
                          key={t}
                          value={t}
                          onSelect={(currentValue) => {
                            setTitle(
                              currentValue === title ? "" : currentValue
                            );
                            setOpenCombobox(false);
                          }}
                        >
                          {t}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Picker */}
        <div className="sm:w-48">
          <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-emerald-200 hover:bg-emerald-50",
                  !date && "text-slate-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                {date ? (
                  format(date, "dd MMM yyyy", { locale: id })
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  setDate(selectedDate);
                  setOpenCalendar(false);
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-1">
          {title && (
            <Badge variant="secondary" className="gap-1">
              <span>{title}</span>
              <button
                onClick={() => setTitle("")}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {date && (
            <Badge variant="secondary" className="gap-1">
              <span>{format(date, "dd MMM yyyy", { locale: id })}</span>
              <button
                onClick={() => setDate(undefined)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}