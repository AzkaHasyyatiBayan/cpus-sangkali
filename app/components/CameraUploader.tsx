"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Compressor from "compressorjs";

interface CameraUploaderProps {
  onUploadSuccess: () => void;
}

export default function CameraUploader({ onUploadSuccess }: CameraUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
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

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        // Kompres file sebelum upload
        const compressedFile = await new Promise<File>((resolve, reject) => {
          new Compressor(files[i], {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            mimeType: "image/webp",
            success(result) {
              resolve(result as File);
            },
            error(err) {
              reject(err);
            },
          });
        });

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("title", title.trim());
        formData.append("date", date);

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
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      alert(`Error: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
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
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-semibold text-lg">
                  {uploadSuccess ? "Berhasil!" : "Unggah Foto"}
                </h2>
                {!isUploading && !uploadSuccess && (
                  <button
                    onClick={resetForm}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="p-6 space-y-4">
                {uploadSuccess ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
                    <p className="text-emerald-800 font-medium text-lg">
                      Foto berhasil diunggah!
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {files.length} foto tersimpan
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Judul Kegiatan
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: Rapat Koordinasi, Kerja Bakti..."
                        className="border-emerald-200 focus:border-emerald-500"
                        disabled={isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Tanggal Kegiatan
                      </label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border-emerald-200 focus:border-emerald-500"
                        disabled={isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Pilih Foto
                      </label>
                      <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className="border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                      >
                        <Upload className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">
                          Ketuk untuk pilih foto atau ambil dari kamera
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          JPG, PNG, WEBP (Maks 10MB per foto)
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </div>

                    {previews.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {previews.map((preview, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative aspect-square rounded-lg overflow-hidden border border-emerald-100"
                          >
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              sizes="96px"
                              className="object-cover"
                              unoptimized
                            />
                            {!isUploading && (
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Mengunggah...</span>
                          <span className="text-emerald-700 font-medium">
                            {uploadProgress}%
                          </span>
                        </div>
                        <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || files.length === 0 || !title.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-medium"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Unggah {files.length > 0 ? `${files.length} Foto` : "Foto"}
                        </>
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