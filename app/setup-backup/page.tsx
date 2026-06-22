"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";

export default function SetupBackupPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setStatus("Menghubungkan ke Google...");

    try {
      const res = await fetch("/api/auth/google");
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setStatus("Gagal menghubungkan Google Drive");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-emerald-800">Setup Backup Google Drive</h1>
        <p className="text-slate-500 text-sm">
          Hubungkan Google Drive untuk backup otomatis semua foto kegiatan.
          <br />
          <strong>Cukup dilakukan 1 kali saja.</strong>
        </p>

        <Button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? "Menghubungkan..." : "Hubungkan Google Drive"}
        </Button>

        {status && <p className="text-sm text-slate-500">{status}</p>}
      </div>
    </div>
  );
}