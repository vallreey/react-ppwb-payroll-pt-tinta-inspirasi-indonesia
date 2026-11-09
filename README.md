# Payroll PT Tinta Inspirasi Indonesia

Aplikasi web React untuk dashboard dan pemantauan lokasi karyawan.

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

4. Buka URL yang ditampilkan Vite, lalu pilih **Tracking Lokasi** dari navigasi samping.

## Halaman Tracking Lokasi

Halaman tracking mengambil data karyawan dari `public/mock/tracking.json` melalui Fetch API. Peta interaktif menggunakan Leaflet dengan tile OpenStreetMap; koneksi internet diperlukan untuk memuat tile peta. Data di halaman mendukung filter divisi, lokasi, dan status, pemilihan karyawan pada peta/tabel, serta riwayat lokasi.

## Pemeriksaan

```sh
npm run lint
npm run build
```
