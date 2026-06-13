```markdown
# CPUS Sangkali (Capture Photo Sangkali) — Galeri Foto Kegiatan

Sistem galeri foto digital untuk mendokumentasikan kegiatan **CPUS Sangkali**.  
Dibangun dengan **Next.js**, **Cloudinary**, dan **Neon Database**.  
Mendukung unggah foto langsung dari kamera HP, filter kegiatan, tampilan thumbnail responsif, dan manajemen penyimpanan.

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Free%20Tier-blue?logo=cloudinary)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-green?logo=neon)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## 🧰 Teknologi

| Bagian | Teknologi |
|--------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion |
| Backend | Next.js API Routes (serverless) |
| Database | Neon (PostgreSQL serverless) via Drizzle ORM |
| Penyimpanan Gambar | Cloudinary (Free Tier, 25 GB) |
| Kompresi Gambar | CompressorJS (WebP, 80% quality, max 1920px) |
| Deployment | Vercel (termasuk environment variables) |

---

## Run Project Secara Lokal

### Prasyarat
- **Node.js** 18+ dan **npm**
- Akun **Neon Database** (Free Tier / Sesuai Kebutuhan)
- Akun **Cloudinary** (Free Tier / SesuaI Kebutuhan)

### 1. Clone repository
```bash
git clone https://github.com/AzkaHasyyatiBayan/cpus-sangkali.git
cd cpus-sangkali
```

### 2. Install dependensi
```bash
npm install
```

### 3. Konfigurasi environment
Buat file `.env.local` di root proyek dan isi dengan kredensial berikut:

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Neon Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup database
Buka Neon SQL Editor dan jalankan file `scripts/setup-db.sql` untuk membuat tabel `activities` dan `photos`.

### 5. Jalankan server development
```bash
npm run dev
```
Buka [http://localhost:3000/gallery](http://localhost:3000/gallery) di browser.

## 📁 Struktur Direktori

```
cpus-sangkali/
├── app/
│   ├── api/
│   │   ├── activities/
│   │   │   ├── [id]/delete/route.ts   # Hapus kegiatan + foto
│   │   │   ├── route.ts               # Daftar kegiatan & foto
│   │   │   └── titles/route.ts        # Judul unik untuk autocomplete
│   │   ├── cloudinary/
│   │   │   └── usage/route.ts         # Info penyimpanan Cloudinary
│   │   └── upload/route.ts            # Upload foto ke Cloudinary + simpan metadata
│   ├── components/
│   │   ├── ui/                        # Komponen dasar (Button, Badge, Kalender, dll.)
│   │   ├── ActivityFilter.tsx         # Filter kegiatan (typeahead + kalender)
│   │   ├── CameraUploader.tsx         # Modal unggah foto + kompresi
│   │   └── PhotoStack.tsx             # Tampilan tumpukan foto per kegiatan
│   ├── gallery/
│   │   └── page.tsx                   # Halaman utama galeri + info storage
│   ├── globals.css                    # Styling global Tailwind v4
│   └── layout.tsx                     # Root layout
├── lib/
│   ├── db.ts                          # Koneksi database Neon
│   ├── schema.ts                      # Skema Drizzle ORM
│   ├── storage.ts                     # Fungsi upload & manajemen Cloudinary
│   └── utils.ts                       # Format tanggal, bytes, dll.
├── scripts/
│   └── setup-db.sql                   # SQL untuk membuat tabel
├── .env.local.example                 # Contoh environment variables
├── next.config.ts
├── package.json
└── README.md
```

## 📝 Lisensi

Proyek ini dibuat untuk keperluan internal CPUS Sangkali. Silakan dimodifikasi sesuai kebutuhan.
```