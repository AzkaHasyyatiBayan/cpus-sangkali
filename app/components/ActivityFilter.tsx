"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Search, X, Filter, MapPin, User, Building2, TreePine } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/lib/utils";
import SuggestionInput from "@/app/components/SuggestionInput";

interface ActivityFilterProps {
  onFilterChange: (title: string, date: string, location: string, uploader: string, category: string) => void;
}

export default function ActivityFilter({ onFilterChange }: ActivityFilterProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState("");
  const [uploader, setUploader] = useState("");
  const [category, setCategory] = useState("");

  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableUploaders, setAvailableUploaders] = useState<string[]>([]);

  const [openCalendar, setOpenCalendar] = useState(false);

  // Fetch suggestions dengan filter category
  useEffect(() => {
    // Fetch titles dengan filter category
    const titleParams = new URLSearchParams();
    if (category) titleParams.set("category", category);
    
    fetch(`/api/activities/titles?${titleParams.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableTitles(d.data); })
      .catch(console.error);

    // Fetch locations dengan filter category
    const locationParams = new URLSearchParams();
    if (category) locationParams.set("category", category);
    
    fetch(`/api/activities/locations?${locationParams.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableLocations(d.data); })
      .catch(console.error);

    fetch("/api/activities/uploaders")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAvailableUploaders(d.data); })
      .catch(console.error);
  }, [category]); // ← Re-fetch saat category berubah

  useEffect(() => {
    const dateStr = date ? format(date, "yyyy-MM-dd") : "";
    onFilterChange(title, dateStr, location, uploader, category);
  }, [title, date, location, uploader, category, onFilterChange]);

  const clearFilters = useCallback(() => {
    setTitle("");
    setDate(undefined);
    setLocation("");
    setUploader("");
    setCategory("");
  }, []);

  const hasActiveFilters = title || date || location || uploader || category;

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-3 sm:p-4 space-y-3">
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

      {/* Filter Kategori Lokasi - DIPINDAH KE ATAS */}
      <div>
        <span className="text-xs text-slate-500 font-medium mb-1.5 block">Kategori Lokasi:</span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategory("")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
              category === "" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Search className="h-3 w-3" />
            Semua
          </button>
          <button
            onClick={() => setCategory("inside")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
              category === "inside" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Building2 className="h-3 w-3" />
            Dalam Gedung
          </button>
          <button
            onClick={() => setCategory("outside")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
              category === "outside" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <TreePine className="h-3 w-3" />
            Luar Gedung
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SuggestionInput
          value={title}
          onChange={setTitle}
          suggestions={availableTitles}
          placeholder="Cari judul..."
          icon={<Search className="h-4 w-4" />}
        />

        <SuggestionInput
          value={location}
          onChange={setLocation}
          suggestions={availableLocations}
          placeholder="Lokasi..."
          icon={<MapPin className="h-4 w-4" />}
        />

        <SuggestionInput
          value={uploader}
          onChange={setUploader}
          suggestions={availableUploaders}
          placeholder="Pengupload..."
          icon={<User className="h-4 w-4" />}
        />

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
          {category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {category === "inside" ? <Building2 className="h-3 w-3" /> : <TreePine className="h-3 w-3" />}
              {category === "inside" ? "Dalam Gedung" : "Luar Gedung"}
              <button onClick={() => setCategory("")}><X className="h-3 w-3 ml-1" /></button>
            </Badge>
          )}
          {title && <Badge variant="secondary">{title}<button onClick={() => setTitle("")}><X className="h-3 w-3 ml-1" /></button></Badge>}
          {location && <Badge variant="secondary">{location}<button onClick={() => setLocation("")}><X className="h-3 w-3 ml-1" /></button></Badge>}
          {uploader && <Badge variant="secondary">{uploader}<button onClick={() => setUploader("")}><X className="h-3 w-3 ml-1" /></button></Badge>}
          {date && <Badge variant="secondary">{format(date, "dd MMM yyyy", { locale: id })}<button onClick={() => setDate(undefined)}><X className="h-3 w-3 ml-1" /></button></Badge>}
        </div>
      )}
    </div>
  );
}