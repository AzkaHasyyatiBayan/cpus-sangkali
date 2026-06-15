"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Search, X, Filter, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { cn } from "@/lib/utils";

interface ActivityFilterProps {
  onFilterChange: (title: string, date: string, location: string, uploader: string) => void;
}

export default function ActivityFilter({ onFilterChange }: ActivityFilterProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState("");
  const [uploader, setUploader] = useState("");

  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableUploaders, setAvailableUploaders] = useState<string[]>([]);

  const [openTitle, setOpenTitle] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [openUploader, setOpenUploader] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  useEffect(() => {
    fetch("/api/activities/titles")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableTitles(d.data); })
      .catch(console.error);

    fetch("/api/activities/locations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableLocations(d.data); })
      .catch(console.error);

    fetch("/api/activities/uploaders")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableUploaders(d.data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const dateStr = date ? format(date, "yyyy-MM-dd") : "";
    onFilterChange(title, dateStr, location, uploader);
  }, [title, date, location, uploader, onFilterChange]);

  const clearFilters = useCallback(() => {
    setTitle("");
    setDate(undefined);
    setLocation("");
    setUploader("");
  }, []);

  const hasActiveFilters = title || date || location || uploader;

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-medium text-emerald-800">Filter Kegiatan</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 h-7">
            <X className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Title */}
        <div>
          <Popover open={openTitle} onOpenChange={setOpenTitle}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between text-left font-normal border-emerald-200 hover:bg-emerald-50">
                <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                {title || <span className="text-slate-400">Cari judul...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-62.5 p-0" align="start">
              <Command>
                <CommandInput placeholder="Ketik judul..." value={title} onValueChange={setTitle} />
                <CommandList>
                  <CommandEmpty>Tidak ada judul ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {availableTitles.filter((t) => t.toLowerCase().includes(title.toLowerCase())).map((t) => (
                      <CommandItem key={t} value={t} onSelect={() => { setTitle(t); setOpenTitle(false); }}>{t}</CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Location */}
        <div>
          <Popover open={openLocation} onOpenChange={setOpenLocation}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between text-left font-normal border-emerald-200 hover:bg-emerald-50">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                {location || <span className="text-slate-400">Lokasi...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-62.5 p-0" align="start">
              <Command>
                <CommandInput placeholder="Ketik lokasi..." value={location} onValueChange={setLocation} />
                <CommandList>
                  <CommandEmpty>Tidak ada lokasi ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {availableLocations.filter((l) => l.toLowerCase().includes(location.toLowerCase())).map((l) => (
                      <CommandItem key={l} value={l} onSelect={() => { setLocation(l); setOpenLocation(false); }}>{l}</CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Uploader */}
        <div>
          <Popover open={openUploader} onOpenChange={setOpenUploader}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between text-left font-normal border-emerald-200 hover:bg-emerald-50">
                <User className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                {uploader || <span className="text-slate-400">Pengupload...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-62.5 p-0" align="start">
              <Command>
                <CommandInput placeholder="Ketik pengupload..." value={uploader} onValueChange={setUploader} />
                <CommandList>
                  <CommandEmpty>Tidak ada pengupload ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {availableUploaders.filter((u) => u.toLowerCase().includes(uploader.toLowerCase())).map((u) => (
                      <CommandItem key={u} value={u} onSelect={() => { setUploader(u); setOpenUploader(false); }}>{u}</CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date */}
        <div>
          <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-emerald-200 hover:bg-emerald-50", !date && "text-slate-400")}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {date ? format(date, "dd MMM yyyy", { locale: id }) : <span>Pilih tanggal</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(selectedDate) => { setDate(selectedDate); setOpenCalendar(false); }} className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-1">
          {title && <Badge variant="secondary">{title}<button onClick={() => setTitle("")}><X className="h-3 w-3 ml-1" /></button></Badge>}
          {location && <Badge variant="secondary">{location}<button onClick={() => setLocation("")}><X className="h-3 w-3 ml-1" /></button></Badge>}
          {uploader && <Badge variant="secondary">{uploader}<button onClick={() => setUploader("")}><X className="h-3 w-3 ml-1" /></button></Badge>}
          {date && <Badge variant="secondary">{format(date, "dd MMM yyyy", { locale: id })}<button onClick={() => setDate(undefined)}><X className="h-3 w-3 ml-1" /></button></Badge>}
        </div>
      )}
    </div>
  );
}