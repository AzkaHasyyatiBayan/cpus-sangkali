import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  // Base URL agar URL di openGraph/twitter menjadi absolut (menghindari warning Next.js)
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),

  title: {
    default: "CPUS Sangkali - Galeri Foto Kegiatan",
    template: "%s | CPUS Sangkali", 
  },

  description:
    "Sistem galeri foto digital untuk mendokumentasikan kegiatan yang dilakukan Puskesmas Sangkali. Unggah, kelola, dan lihat foto kegiatan dengan mudah.",

  keywords: [
    "galeri",
    "foto",
    "kegiatan",
    "cpus",
    "sangkali",
    "dokumentasi",
    "Puskesmas Sangkali", 
  ],

  authors: [{ name: "CPUS Sangkali" }],
  creator: "UPTD Puskesmas Sangkali",
  publisher: "UPTD Puskesmas Sangkali",

  robots: { index: true, follow: true },

  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: ["/logo.png"],
    apple: [{ url: "/logo.png", sizes: "180x180" }],
  },

  openGraph: {
    title: "CPUS Sangkali - Galeri Foto Kegiatan",
    description:
      "Sistem galeri foto digital untuk mendokumentasikan kegiatan di Puskesmas Sangkali.",
    type: "website",
    locale: "id_ID",
    siteName: "CPUS Sangkali",
    url: "/",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Logo UPTD Puskesmas Sangkali",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "CPUS Sangkali - Galeri Foto Kegiatan",
    description:
      "Sistem galeri foto digital untuk mendokumentasikan kegiatan di Puskesmas Sangkali.",
    images: ["/logo.png"],
  },

  // Dukungan PWA-ready
  appleWebApp: {
    capable: true,
    title: "CPUS Sangkali",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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