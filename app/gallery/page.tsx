// app/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, FolderOpen, RefreshCw, HardDrive, AlertTriangle, Trash2, Wrench } from "lucide-react";
import CameraUploader from "@/app/components/CameraUploader";
import ActivityFilter from "@/app/components/ActivityFilter";
import PhotoStack, { type Activity } from "@/app/components/PhotoStack";
import { Button } from "@/app/components/ui/button";
import { formatBytes } from "@/lib/utils";

interface StorageInfo {
  used: number;
  limit: number;
  percent: number;
}

export default function GalleryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    title: "",
    date: "",
    location: "",
    uploader: "",
    category: "", // <-- tambahan
  });
  const [refreshing, setRefreshing] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [gdriveStorage, setGdriveStorage] = useState<StorageInfo | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [dismissToken, setDismissToken] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.title) params.set("title", filters.title);
      if (filters.date) params.set("date", filters.date);
      if (filters.location) params.set("location", filters.location);
      if (filters.uploader) params.set("uploader", filters.uploader);
      if (filters.category) params.set("category", filters.category);

      const res = await fetch(`/api/activities?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const filtered = data.data.filter((activity: Activity) =>
          Array.isArray(activity.dates) && 
          activity.dates.some((d) => d && Array.isArray(d.photos) && d.photos.length > 0)
        );
        setActivities(filtered);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  const fetchStorage = useCallback(async () => {
    try {
      const res = await fetch("/api/storage/usage");
      const data = await res.json();
      if (data.success) setStorage(data.data);
    } catch (error) {
      console.error("Gagal fetch storage:", error);
    }
  }, []);

  const fetchGDriveStorage = useCallback(async () => {
    try {
      const res = await fetch("/api/storage/gdrive");
      const data = await res.json();
      if (data.success) {
        setGdriveStorage(data.data);
        setTokenExpired(false);
      }
    } catch {
      // Token mungkin expired
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchActivities();
      await fetchStorage();
      await fetchGDriveStorage();
    };
    load();
  }, [fetchActivities, fetchStorage, fetchGDriveStorage]);

  // 🔁 handleFilterChange sekarang menerima 5 parameter (title, date, location, uploader, category)
  const handleFilterChange = useCallback(
    (title: string, date: string, location: string, uploader: string, category: string) => {
      setFilters({ title, date, location, uploader, category });
    },
    []
  );

  const handleUploadSuccess = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
    fetchStorage();
    fetchGDriveStorage();
  }, [fetchActivities, fetchStorage, fetchGDriveStorage]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
    fetchStorage();
    fetchGDriveStorage();
  }, [fetchActivities, fetchStorage, fetchGDriveStorage]);

  const handleDismissToken = () => {
    setDismissToken(true);
    setTimeout(() => setDismissToken(false), 3 * 60 * 60 * 1000);
  };

  const filteredActivities = activities.filter((activity) => {
    if (!filters.category) return true;
    if (filters.category === "inside") {
      return activity.category === "inside";
    }
    if (filters.category === "outside") {
      return activity.category === "outside";
    }
    return true;
  });

  const totalPhotos = filteredActivities.reduce(
    (sum, a) => sum + a.dates.reduce((s, d) => s + d.photos.length, 0),
    0
  );
  const isNearLimit = storage && storage.percent > 90;
  const isGDriveNearLimit = gdriveStorage && gdriveStorage.percent > 80;
  const isGDriveFull = gdriveStorage && gdriveStorage.percent >= 95;
  const recommendedDeleteBytes = storage ? storage.used - storage.limit * 0.75 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-6 w-6 text-emerald-600" strokeWidth={1.5} />
            <div>
              <h1 className="text-lg font-bold text-emerald-800 leading-tight tracking-tight">CPUS Sangkali</h1>
              <p className="text-xs text-slate-500">Galeri Foto Kegiatan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/trash"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors bg-slate-100 hover:bg-red-50 px-2.5 py-1 rounded-full"
              title="Tempat Sampah"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Trash</span>
            </a>

            {storage && (
              <div className="flex items-center text-xs text-white bg-emerald-600 px-2.5 py-1 rounded-full shadow-sm">
                <HardDrive className="h-3 w-3 mr-1.5" />
                <span className="hidden sm:inline">{formatBytes(storage.used)} / {formatBytes(storage.limit)}</span>
                <span className="sm:hidden">{storage.percent.toFixed(1)}%</span>
                {storage.percent > 80 && (
                  <span className="ml-1 text-amber-200 font-medium">({storage.percent.toFixed(1)}%)</span>
                )}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isNearLimit && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>Penyimpanan hampir penuh ({storage!.percent.toFixed(1)}%). Disarankan menghapus sekitar <strong>{formatBytes(recommendedDeleteBytes)}</strong> foto.</span>
          </div>
        )}

        {isGDriveNearLimit && gdriveStorage && (
          <div className={`border-t px-4 py-2 text-sm flex items-center gap-2 ${isGDriveFull ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
            <HardDrive className={`h-4 w-4 ${isGDriveFull ? "text-red-500" : "text-amber-500"}`} />
            <span>
              {isGDriveFull 
                ? `Google Drive backup PENUH! (${gdriveStorage.percent.toFixed(1)}%). Segera hapus file lama di Google Drive.`
                : `Google Drive backup tersisa ${formatBytes(gdriveStorage.limit - gdriveStorage.used)} (${gdriveStorage.percent.toFixed(1)}% terpakai)`
              }
            </span>
          </div>
        )}

        {tokenExpired && !dismissToken && (
          <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Token Google Drive expired. Backup tidak berjalan. <a href="/setup-backup" className="underline font-medium">Setup ulang di sini</a></span>
            </div>
            <button onClick={handleDismissToken} className="text-blue-400 hover:text-blue-600 shrink-0 text-xs">Nanti</button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* 🔁 ActivityFilter sekarang mengirim 5 parameter, dan kita siap menerimanya */}
        <ActivityFilter onFilterChange={handleFilterChange} />

        {!loading && filteredActivities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between text-sm text-slate-500">
            <span>Menampilkan <strong className="text-emerald-700">{filteredActivities.length}</strong> kegiatan</span>
            <span>Total <strong className="text-emerald-700">{totalPhotos}</strong> foto</span>
          </motion.div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-emerald-100 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-5 w-40 bg-emerald-100 rounded" />
                  <div className="h-4 w-24 bg-emerald-50 rounded" />
                </div>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((j) => (<div key={j} className="w-32 h-32 bg-emerald-50 rounded-xl skeleton" />))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredActivities.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <FolderOpen className="h-10 w-10 text-emerald-300" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-800 mb-1">Belum Ada Kegiatan</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {filters.title || filters.date || filters.location || filters.uploader || filters.category
                ? "Tidak ada kegiatan yang cocok dengan filter Anda."
                : "Mulai dengan mengunggah foto kegiatan pertama Anda."}
            </p>
          </motion.div>
        )}

        {!loading && (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredActivities.map((activity, index) => (
                <PhotoStack
                  key={activity.id}
                  activity={activity}
                  onRefresh={handleRefresh}
                  isFirstActivity={index === 0}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <CameraUploader onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}