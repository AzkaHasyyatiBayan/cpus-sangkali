"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/app/components/ui/badge";
import {
  Calendar, ImageIcon, X, Trash2, CheckSquare, Square, FileText,
  MapPin, User, Printer, FileDown, Loader2,
} from "lucide-react";

interface Photo {
  id: number;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  thumbnailUrl: string;
  fullUrl: string;
  activityDate: string;
}

interface DateGroup {
  date: string;
  location: string | null;
  uploader: string | null;
  photos: Photo[];
}

export interface Activity {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  uploader: string | null;
  dates: DateGroup[];
}

interface PhotoStackProps {
  activity: Activity;
  onRefresh: () => void;
  isFirstActivity?: boolean;
}

const MAX_PREVIEW = 3;

interface GroupedByDate {
  date: string;
  groups: DateGroup[];
  totalPhotos: number;
}

function groupByDate(dates: DateGroup[]): GroupedByDate[] {
  const map = new Map<string, DateGroup[]>();
  for (const d of dates) {
    const existing = map.get(d.date) || [];
    existing.push(d);
    map.set(d.date, existing);
  }
  return Array.from(map.entries())
    .map(([date, groups]) => ({
      date,
      groups,
      totalPhotos: groups.reduce((sum, g) => sum + g.photos.length, 0),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function PhotoStack({ activity, onRefresh, isFirstActivity }: PhotoStackProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const printMenuRef = useRef<HTMLDivElement>(null);

  const allPhotos = activity.dates.flatMap((d) => d.photos);
  const totalPhotos = allPhotos.length;

  const groupedByDate = groupByDate(activity.dates);

  const uniqueLocations = Array.from(
    new Set(activity.dates.map((d) => d.location).filter(Boolean) as string[])
  );
  const uniqueUploaders = Array.from(
    new Set(activity.dates.map((d) => d.uploader).filter(Boolean) as string[])
  );

  const findGlobalIndexByPhotoId = (photoId: number): number => {
    let globalIdx = 0;
    for (const d of activity.dates) {
      for (const p of d.photos) {
        if (p.id === photoId) return globalIdx;
        globalIdx++;
      }
    }
    return 0;
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedPhotos([]);
  };

  const togglePhotoSelect = (photoId: number) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const selectAllPhotos = () => {
    if (selectedPhotos.length === totalPhotos) setSelectedPhotos([]);
    else setSelectedPhotos(allPhotos.map((p) => p.id));
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return;
    try {
      for (const photoId of selectedPhotos) {
        await fetch(`/api/photos/${photoId}/delete`, { method: "DELETE" });
      }
    } catch (error) {
      console.error("Gagal menghapus foto:", error);
    }
    setSelectMode(false);
    setSelectedPhotos([]);
    onRefresh();
  };

  const handleDownloadWord = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/activities/${activity.id}/export`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Gagal membuat dokumen Word");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dokumentasi_${activity.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal mengunduh dokumen");
    } finally {
      setExporting(false);
      setShowPrintMenu(false);
    }
  };

  const handlePrintPdf = () => {
    window.open(`/print/${activity.id}`, "_blank");
    setShowPrintMenu(false);
  };

  const handleBackupZip = () => {
    window.open(`/api/backup/download?activityId=${activity.id}`, "_blank");
    setShowPrintMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev! < allPhotos.length - 1 ? prev! + 1 : 0));
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : allPhotos.length - 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, allPhotos.length]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-emerald-50 bg-linear-to-r from-emerald-50/50 to-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-emerald-800 text-base">{activity.title}</h3>

              {/* Preview info: sesi | foto | [lokasi kolom] | [uploader kolom] */}
              <div className="flex flex-wrap items-start gap-x-3 gap-y-0.5 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="h-3 w-3 text-emerald-500" />
                  {groupedByDate.length} sesi
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <ImageIcon className="h-3 w-3 text-emerald-500" />
                  {totalPhotos} foto
                </span>

                {/* Kolom lokasi: icon hanya di baris pertama, sisanya menjorok sejajar teks */}
                {uniqueLocations.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {uniqueLocations.map((loc, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i === 0
                          ? <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                          : <span className="inline-block w-3 shrink-0" />
                        }
                        {loc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Kolom uploader: icon hanya di baris pertama, sisanya menjorok sejajar teks */}
                {uniqueUploaders.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    {uniqueUploaders.map((upl, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i === 0
                          ? <User className="h-3 w-3 text-emerald-500 shrink-0" />
                          : <span className="inline-block w-3 shrink-0" />
                        }
                        {upl}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />{totalPhotos}
              </Badge>

              <div className="relative" ref={printMenuRef}>
                <button
                  onClick={() => setShowPrintMenu((v) => !v)}
                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Cetak / unduh dokumentasi"
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                </button>
                {showPrintMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-emerald-100 rounded-lg shadow-lg z-20 overflow-hidden">
                    <button onClick={handleDownloadWord} className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center gap-2 text-slate-700">
                      <FileDown className="h-3.5 w-3.5 text-emerald-600" /> Unduh Word (.docx)
                    </button>
                    <button onClick={handlePrintPdf} className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center gap-2 text-slate-700 border-t border-emerald-50">
                      <Printer className="h-3.5 w-3.5 text-emerald-600" /> Cetak
                    </button>
                    <button onClick={handleBackupZip} className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center gap-2 text-slate-700 border-t border-emerald-50">
                      <FileDown className="h-3.5 w-3.5 text-emerald-600" /> Download Backup ZIP
                    </button>
                  </div>
                )}
              </div>

              {!selectMode ? (
                <button onClick={toggleSelectMode} className="text-slate-400 hover:text-red-500 transition-colors" title="Pilih foto untuk dihapus">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button onClick={selectAllPhotos} className="text-slate-500 hover:text-emerald-600 text-xs">
                    {selectedPhotos.length === totalPhotos ? "Batal" : "Pilih Semua"}
                  </button>
                  <button onClick={deleteSelectedPhotos} disabled={selectedPhotos.length === 0} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50">
                    Hapus
                  </button>
                  <button onClick={toggleSelectMode} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          {activity.description && (
            <div className="mt-3 bg-emerald-50/70 border-l-4 border-emerald-300 rounded-r-lg px-3 py-2">
              <div className="flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-slate-700 italic leading-relaxed ${!descExpanded ? "line-clamp-2" : ""}`}>
                    {activity.description}
                  </p>
                  {activity.description.split(/\s+/).length > 20 && (
                    <button onClick={() => setDescExpanded(!descExpanded)} className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 font-medium">
                      {descExpanded ? "Tutup" : "Baca selengkapnya"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dates & Photos */}
        <div className="p-4 space-y-3">
          {groupedByDate.map((dateBlock) => {
            let lastLocation: string | null = null;

            return (
              <div key={dateBlock.date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    {formatDate(dateBlock.date)}
                  </h4>
                  <span className="text-xs text-slate-400">{dateBlock.totalPhotos} foto</span>
                </div>

                <div className="space-y-3 pl-1 border-l-2 border-emerald-100">
                  {dateBlock.groups.map((group, groupIndex) => {
                    const photosToShow = group.photos.slice(0, MAX_PREVIEW);
                    const remaining = group.photos.length - MAX_PREVIEW;
                    const globalStartIdx = findGlobalIndexByPhotoId(group.photos[0]?.id || 0);

                    const showLocation = group.location && group.location !== lastLocation;
                    if (group.location) lastLocation = group.location;

                    return (
                      <div key={`${group.date}-${group.location ?? "noloc"}-${group.uploader ?? "noupl"}-${groupIndex}`} className="space-y-1.5">
                        {/* Lokasi & uploader sejajar ke samping */}
                        {(showLocation || group.uploader) && (
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {showLocation && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                                {group.location}
                              </span>
                            )}
                            {group.uploader && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3 text-emerald-500 shrink-0" />
                                {group.uploader}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar -mx-1 px-1">
                          {photosToShow.map((photo, photoIndex) => {
                            const isFirstPhoto = isFirstActivity && photoIndex === 0;
                            return (
                              <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: photoIndex * 0.03, duration: 0.3 }}
                                className={`shrink-0 cursor-pointer group relative ${selectMode ? "opacity-80" : ""}`}
                                onClick={() => {
                                  if (selectMode) togglePhotoSelect(photo.id);
                                  else setLightboxIndex(globalStartIdx + photoIndex);
                                }}
                              >
                                <div className="w-32 h-32 rounded-xl overflow-hidden border border-emerald-100 shadow-sm group-hover:shadow-md group-hover:border-emerald-300 transition-all relative">
                                  <Image
                                    src={photo.thumbnailUrl}
                                    alt={photo.fileName || `Foto ${photoIndex + 1}`}
                                    fill
                                    sizes="128px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    unoptimized
                                    loading={isFirstPhoto ? "eager" : "lazy"}
                                    priority={isFirstPhoto}
                                  />
                                  {selectMode && (
                                    <div className="absolute top-1 right-1">
                                      {selectedPhotos.includes(photo.id) ? (
                                        <CheckSquare className="h-5 w-5 text-red-500 drop-shadow-md" />
                                      ) : (
                                        <Square className="h-5 w-5 text-white drop-shadow-md" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}

                          {remaining > 0 && !selectMode && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: MAX_PREVIEW * 0.03 }}
                              className="relative w-32 h-32 shrink-0 cursor-pointer group"
                              onClick={() => setLightboxIndex(globalStartIdx + MAX_PREVIEW)}
                            >
                              <div className="absolute inset-0 rounded-xl bg-emerald-100 border border-emerald-200 rotate-6 translate-x-1.5 translate-y-1" />
                              <div className="absolute inset-0 rounded-xl bg-emerald-50 border border-emerald-200 -rotate-3 -translate-x-1" />
                              <div className="absolute inset-0 rounded-xl overflow-hidden border border-emerald-200 shadow-md group-hover:shadow-lg transition-shadow">
                                <Image
                                  src={group.photos[MAX_PREVIEW].thumbnailUrl}
                                  alt="Foto lainnya"
                                  fill
                                  sizes="128px"
                                  className="object-cover"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-black/55 group-hover:bg-black/65 transition-colors flex flex-col items-center justify-center text-white">
                                  <ImageIcon className="h-4 w-4 mb-1 opacity-90" />
                                  <span className="text-lg font-bold leading-none">+{remaining}</span>
                                  <span className="text-[10px] mt-0.5">foto lagi</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Lightbox */}
      {lightboxIndex !== null && allPhotos[lightboxIndex] && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"><X className="h-6 w-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => prev! > 0 ? prev! - 1 : allPhotos.length - 1); }} className="absolute left-4 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10 text-2xl">‹</button>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => prev! < allPhotos.length - 1 ? prev! + 1 : 0); }} className="absolute right-4 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10 text-2xl">›</button>
          <div className="relative max-w-full max-h-[85vh]">
            <Image src={allPhotos[lightboxIndex].fullUrl} alt={allPhotos[lightboxIndex].fileName || "Foto"} width={1200} height={800} className="object-contain rounded-lg max-h-[85vh] w-auto h-auto" unoptimized />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">{lightboxIndex + 1} / {allPhotos.length}</div>
        </motion.div>
      )}
    </>
  );
}