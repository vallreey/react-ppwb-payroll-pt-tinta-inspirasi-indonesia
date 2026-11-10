# Payroll PT Tinta Inspirasi Indonesia

Aplikasi web pengelolaan payroll dan operasional karyawan PT Tinta Inspirasi Indonesia. Aplikasi dibuat sebagai proyek Tugas Besar I mata kuliah Perancangan dan Pemrograman Web, dengan fokus pada antarmuka responsif, aksesibilitas, navigasi antarhalaman, dan pengambilan data melalui Mock API.

## Tautan Proyek

- **Repository:** [vallreey/react-ppwb-payroll-pt-tinta-inspirasi-indonesia](https://github.com/vallreey/react-ppwb-payroll-pt-tinta-inspirasi-indonesia)

## Fitur Utama

- **Autentikasi dan hak akses:** login, registrasi, pemulihan sesi, serta pembatasan halaman berdasarkan peran pengguna.
- **Dashboard:** ringkasan informasi, pengumuman, dan data operasional.
- **Absensi:** melihat catatan kehadiran dan mencatat absensi.
- **Tracking lokasi:** melihat lokasi karyawan pada peta dan tabel, menyaring data, serta meninjau riwayat rute.
- **Manajemen karyawan:** melihat daftar dan detail karyawan serta mengelola data karyawan sesuai hak akses.
- **Penggajian:** melihat ringkasan dan daftar penggajian, memilih periode, mencari dan menyaring data, melihat rincian, serta mengajukan pengambilan gaji.
- **Izin dan cuti:** mengelola permohonan izin/cuti serta mengajukan permohonan sesuai peran pengguna.
- **Manajemen pengguna:** mengelola akun dan memproses persetujuan pendaftaran.
- **Pengaturan:** mengelola pengaturan perusahaan dan jam kerja.
- **Notifikasi dan preferensi aksesibilitas:** membaca dan mengelola notifikasi serta mengatur tampilan untuk sejumlah kebutuhan aksesibilitas (seperti buta warna dll).

## Halaman dan Navigasi

Halaman aplikasi saling terhubung melalui sidebar dan navigasi aplikasi:

| Halaman | Rute |
|---|---|
| Login | `/login` |
| Registrasi | `/register` |
| Dashboard | `/dashboard` |
| Absensi | `/absensi` |
| Catat absensi | `/absensi/catat` |
| Tracking lokasi | `/tracking-lokasi` |
| Daftar karyawan | `/karyawan` |
| Detail karyawan | `/karyawan/:id` |
| Tambah/ubah karyawan | `/karyawan/baru`, `/karyawan/:id/ubah` |
| Penggajian | `/penggajian` |
| Izin dan cuti | `/izin-cuti` |
| Pengajuan izin dan cuti | `/pengajuan-izin-cuti` |
| Manajemen pengguna | `/pengguna` |
| Persetujuan akun | `/persetujuan-akun` |
| Pengaturan | `/pengaturan` |

Rute tertentu hanya tersedia bagi peran yang berwenang. Jika pengguna membuka halaman yang tidak diizinkan, aplikasi menampilkan informasi akses ditolak.

## Teknologi

- React 19 dan JavaScript ES6+
- Vite
- React Router
- CSS, Flexbox, Grid, media queries, dan Tailwind CSS
- Fetch API dan Axios
- Leaflet dan React Leaflet
- OpenStreetMap untuk tile peta tracking
- Mock API berupa berkas JSON di `public/mock`

## Sumber Data dan Penanganan Kondisi

Data aplikasi dimuat dari berkas JSON pada `public/mock` menggunakan Fetch API atau Axios melalui service di `src/services`. Service menggabungkan data terkait, memvalidasi format respons untuk beberapa fitur, dan menampilkan pesan yang dapat dipahami pengguna ketika permintaan gagal.

Beberapa halaman menyediakan status pemuatan, tampilan error, dan tindakan coba lagi. Perubahan data demo tertentu disimpan pada `localStorage` browser, bukan pada server. Gunakan browser dan profil penyimpanan yang sama untuk melihat perubahan lokal tersebut.

## Persyaratan

- Node.js versi 20.19+ atau 22.12+ dan npm.
- Koneksi internet diperlukan untuk memuat tile OpenStreetMap di halaman Tracking Lokasi.

## Menjalankan Aplikasi

1. Clone repository dan masuk ke direktori proyek:

   ```sh
   git clone https://github.com/vallreey/react-ppwb-payroll-pt-tinta-inspirasi-indonesia.git
   cd react-ppwb-payroll-pt-tinta-inspirasi-indonesia
   ```

2. Pasang dependensi:

   ```sh
   npm install
   ```

3. Jalankan server pengembangan:

   ```sh
   npm run dev
   ```

4. Buka alamat lokal yang ditampilkan Vite di terminal. Aplikasi menggunakan routing berbasis hash, sehingga navigasi halaman berjalan melalui URL dengan format `/#/rute`.

## Pemeriksaan Kode

Jalankan lint dan build produksi:

```sh
npm run lint
npm run build
```

Untuk melihat hasil build secara lokal:

```sh
npm run preview
```

## Responsivitas dan Aksesibilitas

Antarmuka menggunakan Flexbox dan CSS Grid untuk tata letak, serta media queries untuk menyesuaikan sidebar, menu akun, konten, dan komponen halaman pada ukuran layar berbeda. Navigasi mobile menyediakan kontrol buka/tutup sidebar. Menu akun dan submenu aksesibilitas ditata ulang pada layar sempit agar tetap berada di dalam viewport.

Implementasi aksesibilitas mencakup elemen HTML semantik, label form, teks alternatif gambar yang relevan, atribut ARIA untuk kontrol interaktif, tautan lewati ke konten utama, serta dukungan fokus dan navigasi keyboard.