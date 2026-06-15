"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/app/components/ui/badge";
import { Calendar, ImageIcon, X, Trash2, CheckSquare, Square, FileText, MapPin, User } from "lucide-react";

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

const MAX_PREVIEW = 10;

export default function PhotoStack({ activity, onRefresh, isFirstActivity }: PhotoStackProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);

  const allPhotos = activity.dates.flatMap((d) => d.photos);
  const totalPhotos = allPhotos.length;

  const getFlatIndex = (dateIndex: number, photoIndex: number) => {
    let idx = 0;
    for (let i = 0; i < dateIndex; i++) idx += activity.dates[i].photos.length;
    return idx + photoIndex;
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
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-emerald-500" />{activity.dates.length} tanggal</span>
                <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3 text-emerald-500" />{totalPhotos} foto</span>
              </div>
              {(activity.location || activity.uploader) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                  {activity.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-emerald-500" />{activity.location}</span>
                  )}
                  {activity.uploader && (
                    <span className="flex items-center gap-1"><User className="h-3 w-3 text-emerald-500" />{activity.uploader}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />{totalPhotos}
              </Badge>
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
        <div className="p-4 space-y-4">
          {activity.dates.map((dateGroup, dateIndex) => {
            const photosToShow = dateGroup.photos.slice(0, MAX_PREVIEW);
            const remaining = dateGroup.photos.length - MAX_PREVIEW;
            return (
              <motion.div key={dateGroup.date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: dateIndex * 0.05 }} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    {formatDate(dateGroup.date)}
                  </h4>
                  <span className="text-xs text-slate-400">{dateGroup.photos.length} foto</span>
                </div>
                <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar -mx-1 px-1">
                  {photosToShow.map((photo, photoIndex) => {
                    const flatIdx = getFlatIndex(dateIndex, photoIndex);
                    const isFirstPhoto = isFirstActivity && dateIndex === 0 && photoIndex === 0;
                    return (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: photoIndex * 0.03, duration: 0.3 }}
                        className={`shrink-0 cursor-pointer group relative ${selectMode ? "opacity-80" : ""}`}
                        onClick={() => {
                          if (selectMode) togglePhotoSelect(photo.id);
                          else setLightboxIndex(flatIdx);
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
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: MAX_PREVIEW * 0.03 }}
                      className="w-32 h-32 shrink-0 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100 border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-700 cursor-pointer hover:from-emerald-100 hover:to-emerald-200 transition-colors"
                      onClick={() => setLightboxIndex(getFlatIndex(dateIndex, MAX_PREVIEW))}
                    >
                      <span className="text-3xl font-bold">+{remaining}</span>
                      <span className="text-xs font-medium mt-1">Foto Lainnya</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
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