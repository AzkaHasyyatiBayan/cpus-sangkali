"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Trash2, RefreshCw, Undo2, AlertTriangle, CheckSquare, Square, MapPin, User, ArrowLeft } from "lucide-react";
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

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trash");
      const data = await res.json();
      if (data.success) setPhotos(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!initialized) {
    setInitialized(true);
    void fetchTrash();
  }

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
    await fetch(`/api/photos/${id}/restore`, { method: "PATCH" });
    void fetchTrash();
  };

  const handleRestoreSelected = async () => {
    if (selectedPhotos.length === 0) return;
    for (const photoId of selectedPhotos) {
      await fetch(`/api/photos/${photoId}/restore`, { method: "PATCH" });
    }
    setSelectMode(false);
    setSelectedPhotos([]);
    void fetchTrash();
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Hapus permanen? Foto tidak bisa dikembalikan.")) return;
    await fetch(`/api/photos/${id}/permanent`, { method: "DELETE" });
    void fetchTrash();
  };

  const handlePermanentDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return;
    if (!confirm(`Hapus permanen ${selectedPhotos.length} foto? Foto tidak bisa dikembalikan.`)) return;
    for (const photoId of selectedPhotos) {
      await fetch(`/api/photos/${photoId}/permanent`, { method: "DELETE" });
    }
    setSelectMode(false);
    setSelectedPhotos([]);
    void fetchTrash();
  };

  const getThumbnailUrl = (driveFileId: string) => {
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,c_fill/${driveFileId}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-red-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Tombol kembali ke gallery */}
            <Link
              href="/gallery"
              className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
              title="Kembali ke Galeri"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Trash2 className="h-6 w-6 text-red-500 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-red-700 truncate">Tempat Sampah</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Foto yang dihapus dalam 30 hari terakhir</p>
            </div>
          </div>

          {/* Toolbar — wrap di mobile */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {photos.length > 0 && !selectMode && (
              <Button size="sm" variant="outline" onClick={toggleSelectMode} className="text-xs">
                <span className="hidden sm:inline">Pilih</span>
                <CheckSquare className="h-3.5 w-3.5 sm:hidden" />
              </Button>
            )}
            {selectMode && (
              <>
                <Button size="sm" variant="outline" onClick={selectAllPhotos} className="text-xs">
                  <span className="hidden sm:inline">
                    {selectedPhotos.length === photos.length ? "Batal Semua" : "Pilih Semua"}
                  </span>
                  <span className="sm:hidden">
                    {selectedPhotos.length === photos.length ? "Batal" : "Semua"}
                  </span>
                </Button>
                <Button size="sm" onClick={handleRestoreSelected} disabled={selectedPhotos.length === 0} className="text-xs bg-emerald-600 text-white">
                  <Undo2 className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Pulihkan ({selectedPhotos.length})</span>
                  <span className="sm:hidden">({selectedPhotos.length})</span>
                </Button>
                <Button size="sm" onClick={handlePermanentDeleteSelected} disabled={selectedPhotos.length === 0} className="text-xs bg-red-500 text-white">
                  <AlertTriangle className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Hapus ({selectedPhotos.length})</span>
                  <span className="sm:hidden">({selectedPhotos.length})</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={toggleSelectMode} className="text-xs">
                  Batal
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={fetchTrash} className="shrink-0">
              <RefreshCw className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading && <p className="text-center text-slate-500">Memuat...</p>}

        {!loading && photos.length === 0 && (
          <div className="text-center py-16">
            <Trash2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Tempat sampah kosong</p>
          </div>
        )}

        {!loading && photos.length > 0 && (
          <div className="space-y-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`bg-white rounded-lg border p-3 flex items-center gap-3 cursor-pointer ${
                  selectedPhotos.includes(photo.id) ? "border-red-300 bg-red-50/30" : "border-red-50"
                }`}
                onClick={() => {
                  if (selectMode) togglePhotoSelect(photo.id);
                }}
              >
                {/* Thumbnail preview */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <Image
                    src={getThumbnailUrl(photo.driveFileId)}
                    alt={photo.fileName || "Foto"}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{photo.title}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {photo.fileName} • {new Date(photo.activityDate).toLocaleDateString("id-ID")}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {photo.location && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-37.5">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{photo.location}</span>
                      </span>
                    )}
                    {photo.uploader && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-37.5">
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{photo.uploader}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-red-400 mt-0.5">
                    Dihapus: {new Date(photo.deletedAt).toLocaleDateString("id-ID")}
                  </p>
                </div>

                {/* Action buttons — stack di mobile */}
                {selectMode ? (
                  <div className="shrink-0">
                    {selectedPhotos.includes(photo.id) ? (
                      <CheckSquare className="h-5 w-5 text-red-500" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                ) : (
                  <div className="flex sm:flex-row flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleRestore(photo.id)} className="text-xs">
                      <Undo2 className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Pulihkan</span>
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 text-xs" onClick={() => handlePermanentDelete(photo.id)}>
                      <AlertTriangle className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Hapus</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}