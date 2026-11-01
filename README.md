# LaporinAja - Frontend

Aplikasi web **LaporinAja**, platform pengaduan publik yang transparan. Warga melaporkan masalah di sekitarnya (ditangani Satpol PP dan Dishub), dan setiap tahap penanganannya terlihat terbuka lengkap dengan foto bukti, dengan tampilan feed seperti media sosial agar mudah dipantau.

> Repository pasangan: [LaporWarga-BE](https://github.com/FursanNahr/LaporWarga-BE) (REST API). Frontend ini membutuhkan backend yang sedang berjalan.

## Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Vue 3 (`<script setup>`) |
| Build tool | Vite |
| Styling | Tailwind CSS 4 |
| State management | Pinia |
| Routing | Vue Router |
| HTTP client | Axios |
| Ikon dan font | Lucide (`lucide-vue-next`), Plus Jakarta Sans |
| Bahasa | JavaScript |

## Cara Menjalankan

### Prasyarat

- Node.js v24 (diuji pada v24.22.0)
- Git
- **Backend sudah berjalan** di `http://localhost:3000`. Ikuti petunjuk di [README backend](https://github.com/FursanNahr/LaporWarga-BE#readme) terlebih dahulu.

### Langkah

1. **Clone repository**

   ```bash
   git clone https://github.com/FursanNahr/LaporWarga-FE.git
   cd LaporWarga-FE
   ```

2. **Install dependency**

   ```bash
   npm install
   ```

3. **Siapkan file environment.** Salin `.env.example` menjadi `.env` (Windows: `copy .env.example .env`, macOS/Linux: `cp .env.example .env`). Isinya:

   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

   Ubah alamatnya jika backend berjalan di port atau alamat lain.

4. **Jalankan mode pengembangan**

   ```bash
   npm run dev
   ```

   Buka alamat yang tampil di terminal (biasanya `http://localhost:5173`).

Perintah lain: `npm run build` untuk membuat versi produksi, dan `npm run preview` untuk mencobanya secara lokal.

### Akun Contoh

Setelah backend di-seed, kamu bisa masuk dengan akun berikut. Semuanya memakai password yang sama: `Password123!`

| Peran | Email |
| --- | --- |
| Admin | admin@laporwarga.test |
| Instansi (Dishub) | dishub@laporwarga.test |
| Instansi (Satpol PP) | satpolpp@laporwarga.test |
| Warga | warga@laporwarga.test |

## Progress Saat Ini

**Sudah selesai**

- Struktur proyek (halaman per peran, layout, komponen, router, store) dan integrasi ke backend
- Daftar dan masuk, dengan halaman yang dibatasi sesuai peran (Publik, Warga, Instansi, Admin)
- Pembuatan laporan dengan foto, pin lokasi, dan opsi lapor anonim
- Feed laporan terdekat, pencarian, dan filter
- Halaman detail laporan dengan timeline status dan foto per tahap
- Laporan saya, notifikasi, dan konfirmasi hasil ("Sudah beres" / "Belum beres")
- Halaman instansi untuk mengelola progress, dan halaman admin untuk verifikasi, kelola data master, pengaturan SLA, dan log audit

**Sedang / belum dikerjakan**

- Fitur komentar pada laporan
- Sistem penghargaan (poin, lencana, streak)
- Statistik dan papan transparansi
- Desain antarmuka (belum dikerjakan; tampilan saat ini masih bersifat fungsional)

## Struktur Singkat

```
LaporWarga-FE/
├── src/
│   ├── api/          # komunikasi ke backend (axios)
│   ├── assets/       # gambar dan stylesheet
│   ├── components/   # komponen reusable (common, layout, laporan, admin, ...)
│   ├── composables/  # logika reusable (useAuth, useToast, ...)
│   ├── layouts/      # PublicLayout, DashboardLayout, AuthLayout
│   ├── pages/        # halaman per peran (publik, warga, instansi, admin)
│   ├── router/       # rute dan navigation guard
│   ├── stores/       # Pinia
│   └── utils/
└── .env.example
```