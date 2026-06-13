"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/app/components/ui/badge";
import { Calendar, ImageIcon, X, Trash2, CheckSquare, Square } from "lucide-react";

interface Photo {
  id: number;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  thumbnailUrl: string;
  fullUrl: string;
}

interface Activity {
  id: number;
  title: string;
  activityDate: string;
  photos: Photo[];
}

interface PhotoStackProps {
  activity: Activity;
  onDelete: (activityId: number) => void;
}

const MAX_PREVIEW = 10;

export default function PhotoStack({ activity, onDelete }: PhotoStackProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const photosToShow = activity.photos.slice(0, MAX_PREVIEW);
  const remainingCount = activity.photos.length - MAX_PREVIEW;

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
    if (selectedPhotos.length === activity.photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(activity.photos.map((p) => p.id));
    }
  };

  const deleteSelectedPhotos = async () => {
    // Hapus foto terpilih via API (opsional: kita bisa buat endpoint khusus)
    // Untuk sementara, kita hapus seluruh kegiatan jika ada foto yang dipilih
    if (selectedPhotos.length === 0) return;
    // Kita akan hapus seluruh kegiatan karena belum ada endpoint hapus sebagian
    await fetch(`/api/activities/${activity.id}/delete`, { method: "DELETE" });
    onDelete(activity.id);
  };

  const deleteEntireActivity = async () => {
    await fetch(`/api/activities/${activity.id}/delete`, { method: "DELETE" });
    onDelete(activity.id);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden"
      >
        {/* Activity Header */}
        <div className="px-4 py-3 border-b border-emerald-50 bg-linear-to-r from-emerald-50/50 to-white flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-emerald-800 text-base">
              {activity.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm text-slate-500">
                {formatDate(activity.activityDate)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {activity.photos.length} foto
            </Badge>
            {!selectMode ? (
              <button
                onClick={toggleSelectMode}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Pilih foto untuk dihapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={selectAllPhotos}
                  className="text-slate-500 hover:text-emerald-600 text-xs"
                >
                  {selectedPhotos.length === activity.photos.length ? "Batal Semua" : "Pilih Semua"}
                </button>
                <button
                  onClick={deleteSelectedPhotos}
                  disabled={selectedPhotos.length === 0}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                >
                  Hapus Terpilih
                </button>
                <button
                  onClick={toggleSelectMode}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Photo Stack */}
        <div className="p-4">
          <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
            {photosToShow.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`shrink-0 cursor-pointer group relative ${selectMode ? "opacity-80" : ""}`}
                onClick={() => {
                  if (selectMode) {
                    togglePhotoSelect(photo.id);
                  } else {
                    setCurrentPhotoIndex(index);
                    setLightboxOpen(true);
                  }
                }}
              >
                <div className="w-32 h-32 rounded-xl overflow-hidden border border-emerald-100 shadow-sm group-hover:shadow-md group-hover:border-emerald-300 transition-all relative">
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.fileName || `Foto ${index + 1}`}
                    fill
                    sizes="128px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
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
            ))}

            {remainingCount > 0 && !selectMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: MAX_PREVIEW * 0.05 }}
                className="w-32 h-32 shrink-0 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100 border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-700 cursor-pointer hover:from-emerald-100 hover:to-emerald-200 transition-colors"
                onClick={() => {
                  setCurrentPhotoIndex(MAX_PREVIEW);
                  setLightboxOpen(true);
                }}
              >
                <span className="text-3xl font-bold">+{remainingCount}</span>
                <span className="text-xs font-medium mt-1">Foto Lainnya</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Tombol hapus seluruh kegiatan (selalu tampil di luar mode select) */}
        {!selectMode && (
          <div className="px-4 pb-3 flex justify-end">
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Hapus Kegiatan
            </button>
          </div>
        )}
      </motion.div>

      {/* Lightbox */}
      {lightboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : activity.photos.length - 1));
            }}
            className="absolute left-4 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10 text-2xl"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPhotoIndex((prev) => (prev < activity.photos.length - 1 ? prev + 1 : 0));
            }}
            className="absolute right-4 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10 text-2xl"
          >
            ›
          </button>
          {activity.photos[currentPhotoIndex] && (
            <div className="relative max-w-full max-h-[85vh]">
              <Image
                src={activity.photos[currentPhotoIndex].fullUrl}
                alt={activity.photos[currentPhotoIndex].fileName || "Foto"}
                width={1200}
                height={800}
                className="object-contain rounded-lg max-h-[85vh] w-auto h-auto"
                unoptimized
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
            {currentPhotoIndex + 1} / {activity.photos.length}
          </div>
        </motion.div>
      )}

      {/* Konfirmasi hapus kegiatan */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h4 className="font-semibold text-red-700 mb-2">Hapus Kegiatan?</h4>
            <p className="text-sm text-slate-600 mb-4">
              Semua foto dalam kegiatan &ldquo;{activity.title}&rdquo; akan dihapus permanen dari Cloudinary. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteEntireActivity();
                  setShowConfirmDelete(false);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}