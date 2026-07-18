"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, FolderOpen, RefreshCw, HardDrive, AlertTriangle, 
  Trash2, Wrench, CheckSquare, FileDown 
} from "lucide-react";
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
    category: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [gdriveStorage, setGdriveStorage] = useState<StorageInfo | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [dismissToken, setDismissToken] = useState(false);

  // State untuk seleksi kegiatan massal
  const [activitySelectMode, setActivitySelectMode] = useState(false);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

  // Handler seleksi kegiatan
  const toggleActivitySelect = (id: number) => {
    setSelectedActivityIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const selectAllActivities = () => {
    if (selectedActivityIds.length === filteredActivities.length) {
      setSelectedActivityIds([]);
    } else {
      setSelectedActivityIds(filteredActivities.map(a => a.id));
    }
  };

  // Handler Bulk Download
  const handleBulkDownload = async () => {
    if (selectedActivityIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await fetch("/api/activities/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityIds: selectedActivityIds }),
      });
      if (!res.ok) throw new Error("Gagal download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-kegiatan-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setActivitySelectMode(false);
      setSelectedActivityIds([]);
    } catch {
      alert("Gagal mengunduh backup.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Handler Bulk Delete (Soft Delete ke Trash)
  const handleBulkDelete = async () => {
    if (selectedActivityIds.length === 0) return;
    if (!confirm(`Pindahkan ${selectedActivityIds.length} kegiatan ke Tempat Sampah?`)) return;
    
    setIsBulkProcessing(true);
    try {
      const res = await fetch("/api/activities/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityIds: selectedActivityIds }),
      });
      if (!res.ok) throw new Error("Gagal hapus");
      
      setActivitySelectMode(false);
      setSelectedActivityIds([]);
      handleRefresh();
    } catch {
      alert("Gagal memindahkan ke trash.");
    } finally {
      setIsBulkProcessing(false);
    }
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
      {/* Header - Responsive */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-emerald-800 leading-tight tracking-tight truncate">CPUS Sangkali</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">Galeri Foto Kegiatan</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!activitySelectMode ? (
              <Button variant="outline" size="sm" onClick={() => setActivitySelectMode(true)} className="text-xs hidden sm:flex">
                <CheckSquare className="h-3.5 w-3.5 mr-1" /> Pilih Kegiatan
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={selectAllActivities} className="text-xs">
                  {selectedActivityIds.length === filteredActivities.length ? "Batal Semua" : "Pilih Semua"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDownload} 
                  disabled={selectedActivityIds.length === 0 || isBulkProcessing}
                  className="text-xs text-emerald-700 border-emerald-200"
                >
                  <FileDown className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Download</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete} 
                  disabled={selectedActivityIds.length === 0 || isBulkProcessing}
                  className="text-xs text-red-600 border-red-200"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Hapus</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setActivitySelectMode(false); setSelectedActivityIds([]); }} className="text-xs">
                  Batal
                </Button>
              </div>
            )}

            <a
              href="/trash"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors bg-slate-100 hover:bg-red-50 px-2 py-1.5 rounded-full"
              title="Tempat Sampah"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Trash</span>
            </a>

            {storage && (
              <div className="flex items-center text-xs text-white bg-emerald-600 px-2 py-1.5 rounded-full shadow-sm">
                <HardDrive className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{formatBytes(storage.used)} / {formatBytes(storage.limit)}</span>
                <span className="sm:hidden">{storage.percent.toFixed(0)}%</span>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="text-emerald-600 hover:bg-emerald-50 h-8 w-8 sm:h-9 sm:w-9"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Warning banners - responsive text */}
        {isNearLimit && (
          <div className="bg-red-50 border-t border-red-200 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span>Penyimpanan hampir penuh ({storage!.percent.toFixed(1)}%). Disarankan menghapus sekitar <strong>{formatBytes(recommendedDeleteBytes)}</strong> foto.</span>
          </div>
        )}

        {isGDriveNearLimit && gdriveStorage && (
          <div className={`border-t px-3 sm:px-4 py-2 text-xs sm:text-sm flex items-center gap-2 ${isGDriveFull ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
            <HardDrive className={`h-4 w-4 shrink-0 ${isGDriveFull ? "text-red-500" : "text-amber-500"}`} />
            <span>
              {isGDriveFull 
                ? `Google Drive backup PENUH! (${gdriveStorage.percent.toFixed(1)}%). Segera hapus file lama.`
                : `Google Drive backup tersisa ${formatBytes(gdriveStorage.limit - gdriveStorage.used)} (${gdriveStorage.percent.toFixed(1)}% terpakai)`
              }
            </span>
          </div>
        )}

        {tokenExpired && !dismissToken && (
          <div className="bg-blue-50 border-t border-blue-200 px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Wrench className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="truncate">Token Google Drive expired. <a href="/setup-backup" className="underline font-medium">Setup ulang</a></span>
            </div>
            <button onClick={handleDismissToken} className="text-blue-400 hover:text-blue-600 shrink-0 text-xs">Nanti</button>
          </div>
        )}
      </header>

      {/* Main Content - Responsive padding */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 sm:pb-24">
        <ActivityFilter onFilterChange={handleFilterChange} />

        {/* Stats - responsive */}
        {!loading && filteredActivities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
            <span>Menampilkan <strong className="text-emerald-700">{filteredActivities.length}</strong> kegiatan</span>
            <span>Total <strong className="text-emerald-700">{totalPhotos}</strong> foto</span>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-emerald-100 p-3 sm:p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-5 w-32 sm:w-40 bg-emerald-100 rounded" />
                  <div className="h-4 w-20 sm:w-24 bg-emerald-50 rounded" />
                </div>
                <div className="flex gap-2 sm:gap-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-24 h-24 sm:w-32 sm:h-32 bg-emerald-50 rounded-xl skeleton" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredActivities.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-300" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-emerald-800 mb-1">Belum Ada Kegiatan</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xs">
              {filters.title || filters.date || filters.location || filters.uploader || filters.category
                ? "Tidak ada kegiatan yang cocok dengan filter Anda."
                : "Mulai dengan mengunggah foto kegiatan pertama Anda."}
            </p>
          </motion.div>
        )}

        {/* Activities list */}
        {!loading && (
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredActivities.map((activity, index) => (
                <PhotoStack
                  key={activity.id}
                  activity={activity}
                  onRefresh={handleRefresh}
                  isFirstActivity={index === 0}
                  isSelected={selectedActivityIds.includes(activity.id)}
                  onToggleSelect={activitySelectMode ? toggleActivitySelect : undefined}
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