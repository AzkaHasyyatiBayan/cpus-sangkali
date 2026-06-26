"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera, Upload, X, Loader2, CheckCircle, Image as ImageIcon,
  MapPin, User, Search
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Compressor from "compressorjs";
import { MAX_DESCRIPTION_WORDS } from "@/lib/constants";
import SuggestionInput from "@/app/components/SuggestionInput";

interface CameraUploaderProps {
  onUploadSuccess: () => void;
}

export default function CameraUploader({ onUploadSuccess }: CameraUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [uploader, setUploader] = useState("");
  const [category, setCategory] = useState("outside"); // "inside" atau "outside"
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [uploaderSuggestions, setUploaderSuggestions] = useState<string[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const wordCount = description.trim() ? description.trim().split(/\s+/).filter(Boolean).length : 0;
  const isOverLimit = wordCount > MAX_DESCRIPTION_WORDS;

  useEffect(() => {
    if (isOpen) {
      fetch("/api/activities/titles")
        .then((r) => r.json())
        .then((d) => { if (d.success) setTitleSuggestions(d.data); })
        .catch(console.error);

      fetch("/api/activities/locations")
        .then((r) => r.json())
        .then((d) => { if (d.success) setLocationSuggestions(d.data); })
        .catch(console.error);

      fetch("/api/activities/uploaders")
        .then((r) => r.json())
        .then((d) => { if (d.success) setUploaderSuggestions(d.data); })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    setFiles((prev) => [...prev, ...selectedFiles]);
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!title.trim() || !date || files.length === 0) {
      alert("Mohon isi judul, tanggal, dan pilih minimal satu foto.");
      return;
    }
    if (isOverLimit) {
      alert(`Deskripsi maksimal ${MAX_DESCRIPTION_WORDS} kata (saat ini: ${wordCount}).`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const compressedFile = await new Promise<File>((resolve, reject) => {
          new Compressor(files[i], {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.6,
            mimeType: "image/webp",
            success(result) { resolve(result as File); },
            error(err) { reject(err); },
          });
        });

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("title", title.trim());
        formData.append("date", date);
        formData.append("description", description.trim());
        formData.append("location", location.trim());
        formData.append("uploader", uploader.trim());
        formData.append("category", category); // <-- Kirim kategori

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload gagal");
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploadSuccess(true);
      setTimeout(() => {
        resetForm();
        onUploadSuccess();
      }, 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      alert(`Error: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setLocation("");
    setUploader("");
    setCategory("outside");
    setFiles([]);
    setPreviews([]);
    setUploadProgress(0);
    setUploadSuccess(false);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 transition-colors"
      >
        <Camera className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && !isUploading && resetForm()}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-white font-semibold text-lg">
                  {uploadSuccess ? "Berhasil!" : "Unggah Foto"}
                </h2>
                {!isUploading && !uploadSuccess && (
                  <button onClick={resetForm} className="text-white/80 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-4">
                {uploadSuccess ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center py-8">
                    <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
                    <p className="text-emerald-800 font-medium text-lg">Foto berhasil diunggah!</p>
                    <p className="text-slate-500 text-sm mt-1">{files.length} foto tersimpan</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Judul */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Judul Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <SuggestionInput
                        value={title}
                        onChange={setTitle}
                        suggestions={titleSuggestions}
                        disabled={isUploading}
                        placeholder="Ketik atau pilih kegiatan..."
                        icon={<Search className="h-4 w-4" />}
                      />
                      <p className="text-xs text-slate-400 mt-1">Pilih dari daftar atau ketik nama baru</p>
                    </div>

                    {/* Tanggal */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tanggal Kegiatan <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border-emerald-200 focus:border-emerald-500"
                        disabled={isUploading}
                      />
                    </div>

                    {/* Lokasi */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Lokasi Kegiatan <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <SuggestionInput
                        value={location}
                        onChange={setLocation}
                        suggestions={locationSuggestions}
                        disabled={isUploading}
                        placeholder="Ketik atau pilih lokasi..."
                        icon={<MapPin className="h-4 w-4" />}
                      />
                    </div>

                    {/* Pengupload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Diupload oleh <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <SuggestionInput
                        value={uploader}
                        onChange={setUploader}
                        suggestions={uploaderSuggestions}
                        disabled={isUploading}
                        placeholder="Ketik atau pilih pengupload..."
                        icon={<User className="h-4 w-4" />}
                      />
                    </div>

                    {/* ===== TAMBAHAN: KATEGORI LOKASI ===== */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Kategori Lokasi <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={isUploading}
                        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="inside">Dalam Gedung</option>
                        <option value="outside">Luar Gedung</option>
                      </select>
                      <p className="text-xs text-slate-400 mt-1">Pilih apakah kegiatan dilaksanakan di dalam atau di luar gedung</p>
                    </div>

                    {/* Deskripsi */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Deskripsi Singkat <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ceritakan singkat tentang kegiatan ini..."
                        disabled={isUploading}
                        rows={3}
                        className="flex w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-400">Ditampilkan di atas foto</p>
                        <p className={`text-xs font-medium ${isOverLimit ? "text-red-500" : wordCount > MAX_DESCRIPTION_WORDS * 0.9 ? "text-amber-500" : "text-slate-400"}`}>
                          {wordCount}/{MAX_DESCRIPTION_WORDS} kata
                        </p>
                      </div>
                    </div>

                    {/* Pilih Foto */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Pilih Foto <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={isUploading}
                          variant="outline"
                          className="h-20 flex-col gap-1 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400"
                        >
                          <Camera className="h-5 w-5 text-emerald-600" />
                          <span className="text-xs font-medium">Ambil Foto</span>
                          <span className="text-[10px] text-slate-400">Dari kamera</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={isUploading}
                          variant="outline"
                          className="h-20 flex-col gap-1 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400"
                        >
                          <ImageIcon className="h-5 w-5 text-emerald-600" />
                          <span className="text-xs font-medium">Pilih dari Galeri</span>
                          <span className="text-[10px] text-slate-400">Foto yang sudah ada</span>
                        </Button>
                      </div>
                      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" disabled={isUploading} />
                      <p className="text-xs text-slate-400 mt-2 text-center">JPG, PNG, WEBP • Maks 1MB per foto</p>
                    </div>

                    {/* Preview */}
                    {previews.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">{previews.length} foto dipilih</span>
                          {!isUploading && (
                            <button onClick={() => { setFiles([]); setPreviews([]); }} className="text-xs text-red-500 hover:text-red-600">
                              Hapus semua
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {previews.map((preview, index) => (
                            <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square rounded-lg overflow-hidden border border-emerald-100">
                              <Image src={preview} alt={`Preview ${index + 1}`} fill sizes="96px" className="object-cover" unoptimized />
                              {!isUploading && (
                                <button onClick={() => removeFile(index)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Mengunggah...</span>
                          <span className="text-emerald-700 font-medium">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || files.length === 0 || !title.trim() || isOverLimit}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-medium"
                    >
                      {isUploading ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Mengunggah...</>
                      ) : (
                        <><Upload className="h-5 w-5 mr-2" /> Unggah {files.length > 0 ? `${files.length} Foto` : "Foto"}</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}