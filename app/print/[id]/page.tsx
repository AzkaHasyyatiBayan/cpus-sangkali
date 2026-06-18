"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2 } from "lucide-react";
import Image from "next/image";
import type { Activity } from "@/app/components/PhotoStack";

function formatTanggalIndonesia(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PrintActivityPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/activities?id=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data.length > 0) setActivity(d.data[0]); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!activity) {
    return <div className="p-8 text-center text-slate-500">Kegiatan tidak ditemukan.</div>;
  }

  return (
    <div className="print-root">
      <div className="no-print toolbar">
        <span>Pratinjau Cetak: {activity.title}</span>
        <button onClick={() => window.print()} className="print-btn">
          <Printer className="h-4 w-4" /> Cetak / Simpan PDF
        </button>
      </div>

      {activity.dates.flatMap((group) =>
        group.photos.map((photo) => (
          <section key={photo.id} className="a4-page">
            <header className="kop">
              <div className="kop-logo">
                <Image
                  src="/images/logo-tasikmalaya.png"
                  alt="Logo"
                  width={120}
                  height={132}
                  className="kop-logo-img"
                  unoptimized
                />
              </div>
              <div className="kop-text">
                <p className="kop-pemerintah">PEMERINTAH KOTA TASIKMALAYA</p>
                <p className="kop-unit">UPTD PUSKESMAS SANGKALI</p>
                <p className="kop-line">Jalan Tamansari No. 32 Phone 082240014606</p>
                <p className="kop-line">E-mail : pkmsangkali@gmail.com</p>
                <p className="kop-line">TASIKMALAYA</p>
              </div>
            </header>

            <div className="kop-pos-row">Kode Pos : 46166</div>
            <div className="divider" />

            <div className="caption">
              <p>Dokumentasi Kegiatan</p>
              <p>{group.location ? `${activity.title}, ${group.location}` : activity.title}</p>
              <p>Tanggal {formatTanggalIndonesia(group.date)}</p>
              {group.uploader && <p>Diunggah oleh: {group.uploader}</p>}
            </div>

            <div className="photo-wrap">
              <Image
                src={photo.fullUrl}
                alt={photo.fileName || "Foto kegiatan"}
                width={1200}
                height={900}
                unoptimized
                className="photo"
              />
            </div>
          </section>
        ))
      )}

      <style jsx global>{`
        @page { size: A4; margin: 10mm 25.4mm; }

        .print-root { background: #e2e8f0; min-height: 100vh; padding: 24px 0; }
        .toolbar {
          position: sticky; top: 0; z-index: 10;
          background: #047857; color: #fff;
          padding: 12px 16px; margin-bottom: 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .print-btn {
          display: flex; align-items: center; gap: 8px;
          background: #fff; color: #047857;
          padding: 6px 14px; border-radius: 8px;
          font-size: 14px; font-weight: 500; border: none; cursor: pointer;
        }

        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 24px;
          padding: 10mm 25.4mm;
          background: #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.15);
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
        }

        .kop {
          position: relative;
          min-height: 3.5cm;
        }
        .kop-logo {
          position: absolute;
          left: 0;
          top: 0;
          font-size: 0;
          line-height: 0;
        }
        .kop-logo-img { 
          width: 3.18cm;
          height: 3.49cm;
          object-fit: contain; 
          display: block;
          margin: 0;
        }
        .kop-text {
          text-align: center;
        }
        .kop-pemerintah { font-size: 14pt; margin: 0; }
        .kop-unit {
          font-family: "Arial Black", Arial, sans-serif;
          font-weight: 900;
          font-size: 18pt;
          margin: 0;
        }
        .kop-line { font-size: 12pt; margin: 1pt 0; }

        .kop-pos-row { text-align: right; font-size: 12pt; margin: 4px 0 6px; }
        .divider { border-bottom: 3.75pt solid #000; margin: 0 0 18px; }

        .caption { text-align: center; margin-bottom: 18px; font-family: "Times New Roman", Times, serif; }
        .caption p { font-size: 14pt; margin: 2pt 0; }

        .photo-wrap { display: flex; justify-content: center; }
        .photo { width: 100%; height: auto; object-fit: contain; }

        @media print {
          .print-root { background: #fff; padding: 0; }
          .no-print { display: none !important; }
          .a4-page {
            width: auto; min-height: auto; margin: 0; padding: 0;
            box-shadow: none; page-break-after: always;
          }
          .a4-page:last-child { page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}