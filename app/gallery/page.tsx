"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, FolderOpen, RefreshCw, HardDrive, AlertTriangle } from "lucide-react";
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
  // Sekarang filter memiliki 4 field
  const [filters, setFilters] = useState({
    title: "",
    date: "",
    location: "",
    uploader: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.title) params.set("title", filters.title);
      if (filters.date) params.set("date", filters.date);
      if (filters.location) params.set("location", filters.location);
      if (filters.uploader) params.set("uploader", filters.uploader);

      const res = await fetch(`/api/activities?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const filtered = data.data.filter((activity: Activity) =>
          activity.dates.some((d) => d.photos.length > 0)
        );
        setActivities(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
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

  useEffect(() => {
    const load = async () => {
      await fetchActivities();
      await fetchStorage();
    };
    load();
  }, [fetchActivities, fetchStorage]);

  // Handler baru yang menerima 4 parameter
  const handleFilterChange = useCallback(
    (title: string, date: string, location: string, uploader: string) => {
      setFilters({ title, date, location, uploader });
    },
    []
  );

  const handleUploadSuccess = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
    fetchStorage();
  }, [fetchActivities, fetchStorage]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivities();
    fetchStorage();
  }, [fetchActivities, fetchStorage]);

  const totalPhotos = activities.reduce(
    (sum, a) => sum + a.dates.reduce((s, d) => s + d.photos.length, 0),
    0
  );
  const isNearLimit = storage && storage.percent > 90;
  const recommendedDeleteBytes = storage ? storage.used - storage.limit * 0.75 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-emerald-800 leading-tight">CPUS Sangkali</h1>
              <p className="text-xs text-slate-500">Galeri Foto Kegiatan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {storage && (
              <div className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                <HardDrive className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{formatBytes(storage.used)} / {formatBytes(storage.limit)}</span>
                <span className="sm:hidden">{storage.percent.toFixed(1)}%</span>
                {storage.percent > 80 && <span className="ml-1 text-amber-500">({storage.percent.toFixed(1)}%)</span>}
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="text-emerald-600 hover:bg-emerald-50">
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
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        <ActivityFilter onFilterChange={handleFilterChange} />

        {!loading && activities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between text-sm text-slate-500">
            <span>Menampilkan <strong className="text-emerald-700">{activities.length}</strong> kegiatan</span>
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

        {!loading && activities.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <FolderOpen className="h-10 w-10 text-emerald-300" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-800 mb-1">Belum Ada Kegiatan</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {filters.title || filters.date || filters.location || filters.uploader
                ? "Tidak ada kegiatan yang cocok dengan filter Anda."
                : "Mulai dengan mengunggah foto kegiatan pertama Anda."}
            </p>
          </motion.div>
        )}

        {!loading && (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
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