import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CPUS Sangkali - Galeri Foto Kegiatan",
  description:
    "Sistem galeri foto digital untuk mendokumentasikan kegiatan CPUS Sangkali. Unggah, kelola, dan lihat foto kegiatan dengan mudah.",
  keywords: ["galeri", "foto", "kegiatan", "cpus", "sangkali", "dokumentasi"],
  authors: [{ name: "CPUS Sangkali" }],
  openGraph: {
    title: "CPUS Sangkali - Galeri Foto Kegiatan",
    description: "Sistem galeri foto digital untuk mendokumentasikan kegiatan.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}