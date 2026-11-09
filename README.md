# Payroll PT Tinta Inspirasi Indonesia

Aplikasi web React untuk dashboard, penggajian, dan pemantauan lokasi karyawan.

## Teknologi

- React dan Vite
- Leaflet dan React Leaflet
- OpenStreetMap untuk tile peta
- Mock API berbentuk JSON di folder `public/mock`

## Menjalankan aplikasi

1. Pastikan Node.js dan npm sudah terpasang.
2. Pasang dependensi:

   ```sh
   npm install
   ```

3. Jalankan server lokal:

   ```sh
   npm run dev
   ```

4. Buka URL yang ditampilkan Vite, lalu pilih halaman yang ingin dibuka dari navigasi samping.

## Halaman Tracking Lokasi

Halaman tracking mengambil data karyawan dari `public/mock/tracking.json` melalui Fetch API. Peta interaktif menggunakan Leaflet dengan tile OpenStreetMap; koneksi internet diperlukan untuk memuat tile peta. Data di halaman mendukung filter divisi, lokasi, dan status, pemilihan karyawan pada peta/tabel, serta riwayat lokasi.

## Halaman Penggajian

Halaman penggajian mengambil data periode, nominal, status pembayaran, dan aktivitas dari `public/mock/payroll.json`. Nama karyawan diambil dengan Fetch API dari `public/mock/employees.json`, kemudian digabungkan dengan data pembayaran. Fitur halaman meliputi ringkasan payroll, filter periode/divisi/status, pencarian karyawan, pagination, detail pembayaran, permintaan pengambilan gaji simulasi, dan aktivitas terbaru.

Data pada kedua halaman merupakan mock untuk kebutuhan pengembangan frontend dan bukan data penggajian atau lokasi aktual.

## Pemeriksaan

```sh
npm run lint
npm run build
```
