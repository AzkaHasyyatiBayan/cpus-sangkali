# CPUS Sangkali (Capture Photo Sangkali)

Sistem galeri foto digital untuk mendokumentasikan kegiatan **CPUS Sangkali**.

Dibangun menggunakan **Next.js**, **Cloudinary**, dan **Neon Database**, aplikasi ini mendukung unggah foto langsung dari kamera ponsel, pengelompokan berdasarkan kegiatan, filter pencarian, serta manajemen penyimpanan gambar secara efisien.

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Free%20Tier-blue?logo=cloudinary)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-green?logo=neon)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)


## Teknologi yang Digunakan

| Bagian | Teknologi |
|---------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion |
| Backend | Next.js API Routes (Serverless) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Penyimpanan Gambar | Cloudinary |
| Kompresi Gambar | CompressorJS |
| Deployment | Vercel |

---

# Menjalankan Project Secara Lokal

## Prasyarat

Pastikan telah menginstal:

- Node.js 18 atau lebih baru
- npm
- Akun Neon Database
- Akun Cloudinary

---

## 1. Clone Repository

```bash
git clone https://github.com/AzkaHasyyatiBayan/cpus-sangkali.git
cd cpus-sangkali
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Konfigurasi Environment Variables

Buat file `.env.local` pada root project:

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Setup Database

Buka **Neon SQL Editor**, kemudian jalankan file:

```sql
scripts/setup-db.sql
```

Perintah tersebut akan membuat tabel:

- `activities`
- `photos`

---

## 5. Jalankan Development Server

```bash
npm run dev
```

Buka browser dan akses:

```text
http://localhost:3000/gallery
```

---

# Struktur Direktori

```text
cpus-sangkali/
│
├── app/
│   ├── api/
│   │   ├── activities/
│   │   │   ├── [id]/delete/route.ts
│   │   │   ├── route.ts
│   │   │   └── titles/route.ts
│   │   │
│   │   ├── cloudinary/
│   │   │   └── usage/route.ts
│   │   │
│   │   └── upload/route.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── ActivityFilter.tsx
│   │   ├── CameraUploader.tsx
│   │   └── PhotoStack.tsx
│   │
│   ├── gallery/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   └── layout.tsx
│
├── lib/
│   ├── db.ts
│   ├── schema.ts
│   ├── storage.ts
│   └── utils.ts
│
├── scripts/
│   └── setup-db.sql
│
├── .env.local.example
├── next.config.ts
├── package.json
└── README.md
```

---

# Database Schema

## activities

Menyimpan informasi kegiatan.

| Kolom | Tipe |
|---------|---------|
| id | UUID |
| title | TEXT |
| date | DATE |
| created_at | TIMESTAMP |

## photos

Menyimpan metadata foto yang diunggah.

| Kolom | Tipe |
|---------|---------|
| id | UUID |
| activity_id | UUID |
| public_id | TEXT |
| image_url | TEXT |
| uploaded_at | TIMESTAMP |

---

# Cloudinary Storage

Foto yang diunggah akan:

1. Dikompresi menjadi format WebP
2. Diresize maksimal 1920px
3. Diunggah ke Cloudinary
4. Metadata disimpan ke Neon Database

---

# Deployment

Project dapat dideploy menggunakan:

- Vercel
- Cloudinary
- Neon PostgreSQL

Pastikan seluruh Environment Variables telah dikonfigurasi pada dashboard Vercel sebelum proses deployment.

---

# Lisensi

Proyek ini dibuat untuk kebutuhan internal **CPUS Sangkali** dan dapat dimodifikasi sesuai kebutuhan organisasi.