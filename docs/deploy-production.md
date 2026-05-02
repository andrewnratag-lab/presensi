# Deploy Production Presensi ke Vercel

## Ringkasan

Project ini sekarang memakai:

- Nuxt 3 untuk frontend dan server API
- Postgres untuk penyimpanan data persisten
- Environment variable `DATABASE_URL` atau `POSTGRES_URL` untuk koneksi database

Ini cocok untuk Vercel karena filesystem Vercel tidak persisten, jadi SQLite lokal tidak lagi dipakai.

## Yang perlu disiapkan

- akun GitHub
- akun Vercel
- satu database Postgres

Rekomendasi paling praktis:

1. push project ke GitHub
2. buat database Postgres dari Vercel Marketplace
3. import repo ke Vercel
4. isi environment variable
5. deploy

## Opsi database yang disarankan

Di Vercel per Mei 2026, jalur resminya adalah memakai integrasi Marketplace Storage untuk Postgres seperti:

- Neon
- Supabase
- Aurora Postgres

Saat integrasi dipasang, Vercel biasanya akan menyuntikkan connection string otomatis ke project Anda.

## Langkah deploy dari nol

### 1. Push project ke GitHub

Di folder project:

```bash
git init
git add .
git commit -m "Prepare Postgres deployment for Vercel"
```

Lalu buat repo GitHub dan push ke sana.

### 2. Buat project di Vercel

1. Buka [Vercel New Project](https://vercel.com/new).
2. Login dan pilih repo GitHub ini.
3. Klik `Import`.

Vercel akan mendeteksi Nuxt secara otomatis. Build command default `nuxt build` sudah sesuai.

### 3. Tambahkan database Postgres

1. Di dashboard project Vercel, buka tab `Storage`.
2. Klik `Create Database`.
3. Pilih provider Postgres, misalnya `Neon`.
4. Selesaikan proses integrasi.

Kalau integrasi menambahkan `POSTGRES_URL`, aplikasi ini langsung bisa memakainya.
Kalau provider Anda memberi `DATABASE_URL`, aplikasi ini juga mendukungnya.

### 4. Atur environment variables

Di `Project Settings -> Environment Variables`, pastikan minimal ada:

```env
NUXT_PUBLIC_APP_BASE_URL=https://nama-project-anda.vercel.app
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Kalau integrasi Vercel Marketplace sudah membuat `POSTGRES_URL`, Anda cukup isi:

```env
NUXT_PUBLIC_APP_BASE_URL=https://nama-project-anda.vercel.app
```

Catatan:

- pakai URL Vercel production Anda untuk `NUXT_PUBLIC_APP_BASE_URL`
- setiap perubahan environment variable perlu deploy ulang agar dipakai deployment baru

### 5. Deploy

Klik `Deploy`.

Saat deployment pertama berjalan:

- Nuxt akan dibuild oleh Vercel
- aplikasi akan membuat tabel Postgres otomatis saat pertama kali mengakses database

Tabel yang dibuat otomatis:

- `attendance_records`
- `attendance_sessions`

### 6. Update URL production final

Kalau Anda nanti menambahkan custom domain, ubah:

```env
NUXT_PUBLIC_APP_BASE_URL=https://presensi.domainanda.com
```

lalu redeploy.

## Menjalankan lokal dengan Postgres

Kalau ingin test lokal sebelum push:

1. copy `.env.example` menjadi `.env`
2. isi `DATABASE_URL`
3. jalankan:

```bash
npm install
npm run dev
```

Contoh `.env`:

```env
NUXT_PUBLIC_APP_BASE_URL=http://localhost:3000
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

## Deploy ke server non-Vercel

Kalau suatu saat Anda ingin menjalankan project ini di VPS atau Docker, sekarang yang dibutuhkan hanya:

```env
NUXT_PUBLIC_APP_BASE_URL=https://domain-atau-ip-anda
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

`docker-compose.yml` sudah disesuaikan untuk meneruskan `DATABASE_URL` ke container.

## Troubleshooting cepat

### Build sukses tapi API error

Biasanya `DATABASE_URL` atau `POSTGRES_URL` belum terpasang di Vercel.

### QR check-in mengarah ke URL yang salah

Periksa `NUXT_PUBLIC_APP_BASE_URL`. Nilainya harus domain public yang benar, bukan `localhost`.

### Data tidak muncul setelah deploy

Pastikan deployment memakai database yang sama dengan environment yang aktif. Preview dan Production bisa punya env yang berbeda.

## Ringkasannya

Untuk production di Vercel, alurnya sekarang adalah:

1. repo di GitHub
2. database Postgres dari Marketplace Vercel
3. set `NUXT_PUBLIC_APP_BASE_URL`
4. pastikan `DATABASE_URL` atau `POSTGRES_URL` tersedia
5. deploy ke Vercel
