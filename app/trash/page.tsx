"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { 
  Trash2, RefreshCw, Undo2, AlertTriangle, CheckSquare, Square, 
  MapPin, User, ArrowLeft, Clock, Image as ImageIcon, ArrowRight
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import Image from "next/image";

interface DeletedPhoto {
  id: number;
  driveFileId: string;
  fileName: string | null;
  activityDate: string;
  title: string;
  location: string | null;
  uploader: string | null;
  deletedAt: string;
}

export default function TrashPage() {
  const [photos, setPhotos] = useState<DeletedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trash");
      const data = await res.json();
      if (data.success) setPhotos(data.data);
    } catch (e) {
      console.error("Gagal memuat tempat sampah:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!initialized) {
    setInitialized(true);
    void fetchTrash();
  }

  // Helper: Hitung berapa hari yang lalu
  const getDaysAgo = (dateString: string) => {
    const deleted = new Date(dateString).getTime();
    const now = new Date().getTime();
    const days = Math.floor((now - deleted) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hari ini";
    if (days === 1) return "Kemarin";
    return `${days} hari yang lalu`;
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
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map((p) => p.id));
    }
  };

  const handleRestore = async (id: number) => {
    setActionLoading(true);
    await fetch(`/api/photos/${id}/restore`, { method: "PATCH" });
    setActionLoading(false);
    void fetchTrash();
  };

  const handleRestoreSelected = async () => {
    if (selectedPhotos.length === 0) return;
    setActionLoading(true);
    for (const photoId of selectedPhotos) {
      await fetch(`/api/photos/${photoId}/restore`, { method: "PATCH" });
    }
    setActionLoading(false);
    setSelectMode(false);
    setSelectedPhotos([]);
    void fetchTrash();
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Hapus permanen? Foto tidak bisa dikembalikan.")) return;
    setActionLoading(true);
    await fetch(`/api/photos/${id}/permanent`, { method: "DELETE" });
    setActionLoading(false);
    void fetchTrash();
  };

  const handlePermanentDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;
    if (!confirm(`Hapus permanen ${selectedPhotos.length} foto? Tindakan ini tidak bisa dibatalkan.`)) return;
    setActionLoading(true);
    for (const photoId of selectedPhotos) {
      await fetch(`/api/photos/${photoId}/permanent`, { method: "DELETE" });
    }
    setActionLoading(false);
    setSelectMode(false);
    setSelectedPhotos([]);
    void fetchTrash();
  };

  const getThumbnailUrl = (driveFileId: string) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,c_fill/${driveFileId}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header Modern */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/gallery"
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors shrink-0"
              title="Kembali ke Galeri"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="p-2 bg-rose-100 rounded-xl shrink-0">
              <Trash2 className="h-5 w-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">Tempat Sampah</h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Foto dihapus permanen setelah 30 hari
              </p>
            </div>
          </div>

          {/* Toolbar Interaktif */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {photos.length > 0 && !selectMode && (
              <Button size="sm" variant="outline" onClick={toggleSelectMode} className="gap-2">
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Pilih</span>
              </Button>
            )}
            
            {selectMode && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <Button size="sm" variant="outline" onClick={selectAllPhotos} className="gap-2">
                  {selectedPhotos.length === photos.length ? "Batal Semua" : "Pilih Semua"}
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleRestoreSelected} 
                  disabled={selectedPhotos.length === 0 || actionLoading} 
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Undo2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Pulihkan ({selectedPhotos.length})</span>
                </Button>
                <Button 
                  size="sm" 
                  onClick={handlePermanentDeleteSelected} 
                  disabled={selectedPhotos.length === 0 || actionLoading} 
                  className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Hapus ({selectedPhotos.length})</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={toggleSelectMode}>
                  Batal
                </Button>
              </div>
            )}
            
            <Button variant="ghost" size="icon" onClick={fetchTrash} disabled={loading} className="shrink-0">
              <RefreshCw className={`h-5 w-5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="w-24 h-8 bg-slate-200 rounded-lg shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && photos.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Tempat sampah kosong</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Tidak ada foto yang dihapus. Foto yang Anda hapus akan muncul di sini selama 30 hari sebelum dihapus permanen.
            </p>
            <Link href="/gallery">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                Kembali ke Galeri <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* List Foto */}
        {!loading && photos.length > 0 && (
          <div className="space-y-3">
            {photos.map((photo) => {
              const isSelected = selectedPhotos.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => selectMode && togglePhotoSelect(photo.id)}
                  className={`group relative bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-300 cursor-default ${
                    isSelected
                      ? "border-rose-300 bg-rose-50/40 ring-1 ring-rose-300 shadow-sm"
                      : "border-slate-100 hover:border-rose-200 hover:shadow-md"
                  } ${selectMode ? "cursor-pointer" : ""}`}
                >
                  {/* Checkbox (Hanya muncul di select mode) */}
                  {selectMode && (
                    <div className="absolute top-4 left-4 sm:static sm:order-first z-10">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-rose-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-300 group-hover:text-slate-400" />
                      )}
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className={`w-full sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200 ${selectMode ? "sm:ml-0" : ""}`}>
                    <Image
                      src={getThumbnailUrl(photo.driveFileId)}
                      alt={photo.fileName || "Foto"}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                      unoptimized
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate pr-4">
                        {photo.title}
                      </p>
                      {/* Badge Waktu Hapus */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-medium border border-rose-100 shrink-0">
                        <Clock className="h-3 w-3" />
                        {getDaysAgo(photo.deletedAt)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3 text-slate-400" />
                      {photo.fileName || "Tanpa nama file"}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                      {photo.location && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-30 sm:max-w-none">{photo.location}</span>
                        </span>
                      )}
                      {photo.uploader && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-30 sm:max-w-none">{photo.uploader}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!selectMode && (
                    <div className="flex sm:flex-col gap-2 shrink-0 mt-2 sm:mt-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => { e.stopPropagation(); handleRestore(photo.id); }} 
                        disabled={actionLoading}
                        className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 h-9"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>Pulihkan</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={(e) => { e.stopPropagation(); handlePermanentDelete(photo.id); }} 
                        disabled={actionLoading}
                        className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 h-9"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}