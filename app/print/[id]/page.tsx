"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2 } from "lucide-react";
import Image from "next/image";
import type { Activity } from "@/app/components/PhotoStack";

// Format tanggal: "Senin, 20 April 2026"
function formatHariTanggal(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
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
      .then((d) => {
        if (d.success && d.data.length > 0) setActivity(d.data[0]);
      })
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
    return (
      <div className="p-8 text-center text-slate-500">
        Kegiatan tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="print-root">
      {/* Toolbar - hanya muncul di preview, tidak di-print */}
      <div className="no-print toolbar">
        <span>Pratinjau Cetak: {activity.title}</span>
        <button onClick={() => window.print()} className="print-btn">
          <Printer className="h-4 w-4" /> Cetak
        </button>
      </div>

      {/* Render setiap foto sebagai halaman A4 terpisah */}
      {activity.dates.flatMap((group) =>
        group.photos.map((photo) => {
          const hariTanggal = formatHariTanggal(group.date);

          const cleanTitle = activity.title.split(",")[0].trim();

          return (
            <section key={photo.id} className="a4-page">
              {/* KOP SURAT */}
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
                  <p className="kop-line">
                    Jalan Tamansari No. 32 Phone 082240014606
                  </p>
                  <p className="kop-line">E-mail : pkmsangkali@gmail.com</p>
                  <p className="kop-line">TASIKMALAYA</p>
                </div>
                <div className="kop-spacer" />
              </header>

              <div className="kop-pos-row">Kode Pos : 46166</div>
              <div className="divider" />

              {/* CAPTION ATAS - sesuai template Word */}
              <div className="caption">
                <p>Dokumentasi Kegiatan</p>
                <p>
                  {group.location
                    ? `${cleanTitle}, ${group.location}`
                    : cleanTitle}
                </p>
                <p>Tanggal {hariTanggal}</p>
              </div>

              {/* FOTO DENGAN CONSTRAINT AGAR TIDAK TERPISAH DARI KOP */}
              <div className="photo-wrap">
                <div className="photo-container">
                  <Image
                    src={photo.fullUrl}
                    alt={photo.fileName || "Foto kegiatan"}
                    width={1200}
                    height={900}
                    unoptimized
                    className="photo"
                  />

                  {/* OVERLAY: Layout rapi tanpa duplikasi */}
                  <div className="photo-overlay">
                    {/* Baris 1: Nama Kegiatan (sudah dibersihkan dari lokasi) */}
                    <div className="overlay-row overlay-row-main">
                      <span className="overlay-kegiatan">{cleanTitle}</span>
                    </div>

                    {/* Garis separator */}
                    <div className="overlay-divider" />

                    {/* Baris 2: Lokasi */}
                    <div className="overlay-row">
                      <span className="overlay-label">Lokasi:</span>
                      <span className="overlay-value">
                        {group.location || "Puskesmas Sangkali"}
                      </span>
                    </div>

                    {/* Garis separator */}
                    <div className="overlay-divider" />

                    {/* Baris 3: Hari dan Tanggal */}
                    <div className="overlay-row">
                      <span className="overlay-label">Tanggal:</span>
                      <span className="overlay-value">{hariTanggal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })
      )}

      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm 25.4mm;
        }

        .print-root {
          background: #e2e8f0;
          min-height: 100vh;
          padding: 24px 0;
        }

        .toolbar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #047857;
          color: #fff;
          padding: 12px 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .print-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          color: #047857;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
        }

        .a4-page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 24px;
          padding: 10mm 25.4mm;
          background: #fff;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;

          /* PENTING: Cegah page break di tengah section */
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* KOP SURAT */
        .kop {
          display: grid;
          grid-template-columns: 3.3cm 1fr 3.3cm;
          align-items: start;
        }

        .kop-logo {
          font-size: 0;
          line-height: 0;
        }

        .kop-logo-img {
          width: 3.18cm;
          height: 3.49cm;
          object-fit: contain;
          display: block;
        }

        .kop-text {
          text-align: center;
        }

        .kop-text p {
          line-height: 1.15;
        }

        .kop-pemerintah {
          font-size: 14pt;
          margin: 0;
        }

        .kop-unit {
          font-family: "Arial Black", Arial, sans-serif;
          font-weight: 900;
          font-size: 15pt;
          margin: 0;
        }

        .kop-line {
          font-size: 12pt;
          margin: 1pt 0;
        }

        .kop-spacer {
        }

        .kop-pos-row {
          text-align: right;
          font-size: 12pt;
          margin: 0px 0 6px;
        }

        .divider {
          border-bottom: 3.75pt solid #000;
          margin: 0 0 18px;
        }

        /* CAPTION ATAS */
        .caption {
          text-align: center;
          margin-bottom: 18px;
          font-family: "Times New Roman", Times, serif;
        }

        .caption p {
          font-size: 14pt;
          margin: 2pt 0;
        }

        /* FOTO DENGAN CONSTRAINT AGAR TIDAK TERPISAH DARI KOP */
        .photo-wrap {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .photo-container {
          position: relative;
          display: inline-block;
          max-width: 100%;
        }

        .photo {
          /* Batasi tinggi foto agar tidak terpisah dari kop */
          max-height: 180mm;
          max-width: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          display: block;
        }

        /* OVERLAY: Layout rapi tanpa duplikasi */
        .photo-overlay {
          position: absolute;
          bottom: 12px;
          left: 12px;
          max-width: calc(100% - 24px);
          min-width: 280px;
          background: rgba(0, 0, 0, 0.75);
          color: #fff;
          padding: 10px 14px;
          border-radius: 6px;
          font-family: Arial, Helvetica, sans-serif;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          border-left: 3px solid #10b981;
        }

        .overlay-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          line-height: 1.3;
        }

        .overlay-row-main {
          gap: 10px;
        }

        .overlay-kegiatan {
          font-size: 12pt;
          font-weight: bold;
          line-height: 1.3;
          word-wrap: break-word;
        }

        .overlay-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.3);
          margin: 6px 0;
        }

        .overlay-label {
          font-size: 9pt;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          min-width: 50px;
        }

        .overlay-value {
          font-size: 10pt;
          font-weight: 500;
          line-height: 1.3;
          word-wrap: break-word;
        }

        /* PRINT STYLES */
        @media print {
          .print-root {
            background: #fff;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .a4-page {
            width: auto;
            min-height: auto;
            margin: 0;
            padding: 0;
            box-shadow: none;
            page-break-after: always;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .a4-page:last-child {
            page-break-after: auto;
          }

          /* Pastikan foto tidak terpisah dari kop saat print */
          .photo {
            max-height: 180mm !important;
            max-width: 100% !important;
            width: auto !important;
            height: auto !important;
          }

          .photo-container {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Overlay tetap tampil saat print dengan warna */
          .photo-overlay {
            background: rgba(0, 0, 0, 0.75) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}