# Payroll PT Tinta Inspirasi Indonesia

Aplikasi web pengelolaan payroll dan operasional karyawan PT Tinta Inspirasi Indonesia. Aplikasi dibuat sebagai proyek Tugas Besar I mata kuliah Perancangan dan Pemrograman Web, dengan fokus pada antarmuka responsif, aksesibilitas, navigasi antarhalaman, dan pengambilan data melalui Mock API. Halaman Tracking Lokasi juga menggunakan tile peta OpenStreetMap.

## Tautan Proyek

- **Repository:** [vallreey/react-ppwb-payroll-pt-tinta-inspirasi-indonesia](https://github.com/vallreey/react-ppwb-payroll-pt-tinta-inspirasi-indonesia)

## Fitur Utama

- **Autentikasi dan hak akses:** login, registrasi, pemulihan sesi, serta pembatasan halaman berdasarkan peran pengguna.
- **Dashboard:** ringkasan informasi, kehadiran karyawan, pengumuman, submission, tugas, jadwal, dan daftar libur nasional.
- **Absensi:** melihat catatan kehadiran dan mencatat absensi.
- **Tracking lokasi:** melihat lokasi karyawan pada peta OpenStreetMap dan tabel, menyaring data, serta meninjau rute perjalanan.
- **Manajemen karyawan:** melihat ringkasan status/gender dengan ikon, mencari dan menyaring daftar, melihat detail, mengelola status, serta mengekspor hasil ke CSV atau mencetak/menyimpan hasil filter sebagai PDF. Tombol tambah karyawan melayang di kanan bawah dan hanya tersedia untuk peran yang berwenang.
- **Penggajian:** melihat ringkasan dan daftar penggajian, memilih periode, mencari dan menyaring data, melihat rincian, serta mengajukan pengambilan gaji.
- **Izin dan cuti:** mengelola permohonan izin/cuti serta mengajukan permohonan sesuai peran pengguna.
- **Manajemen pengguna:** mengelola akun dan memproses persetujuan pendaftaran.
- **Pengaturan:** mengelola pengaturan perusahaan dan jam kerja.
- **Menu akun:** membuka profil pengguna, logout, serta mengelola preferensi aksesibilitas seperti simulasi buta warna, kontras, ukuran tampilan, keterbacaan, dan navigasi keyboard.
- **Notifikasi:** membaca, memfilter, menghapus, menandai notifikasi sebagai dibaca, atau memulihkan notifikasi demo.

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

## 2. Teknologi & Requirements

### 2.1 Frontend Stack

| Spesifikasi | Implementasi | Lokasi dan penjelasan |
|---|---|---|
| Framework JavaScript | React 19 | `package.json` mencantumkan React. `src/main.jsx` memasang aplikasi React, sedangkan `src/App.jsx` mengatur routing dan halaman. |
| Styling dan komponen | CSS, Flexbox, Grid, media queries, Tailwind CSS | Gaya global berada di `src/App.css`, `src/index.css`, dan `src/tailwind.css`. Gaya spesifik halaman ada di `src/PayrollPage.css` dan `src/TrackingPage.css`. |
| HTTP client | Fetch API dan Axios | `src/services/apiClient.js` menyediakan Axios client serta helper Fetch. Service fitur menggunakannya untuk mengambil data. |
| Routing | React Router | `src/App.jsx` mendefinisikan rute; `src/components/RouteGuards.jsx` menjaga akses halaman berdasarkan autentikasi dan peran. |
| Peta | Leaflet dan React Leaflet | Dependensi tercantum di `package.json`; tile peta berasal dari OpenStreetMap dan memerlukan koneksi internet. |

### 2.2 Data Source

Data utama aplikasi menggunakan **Mock API lokal berbentuk file JSON**. File JSON tidak diimpor langsung ke komponen untuk dirender: service mengambilnya melalui HTTP dengan `fetch` atau Axios, lalu halaman menampilkan hasilnya. Aplikasi juga mengonsumsi API eksternal untuk hari libur nasional dan layanan tile peta.

| Lokasi | Penjelasan |
|---|---|
| `public/mock/` | Kumpulan data JSON demo, termasuk `dashboard.json`, `attendance.json`, `employees.json`, `karyawan.json`, `departments.json`, `users.json`, `leaveRequests.json`, `payroll.json`, `settings.json`, dan `tracking.json`. File di folder `public` dilayani sebagai aset statis oleh Vite. |
| `src/services/mockDb.js` | Mengambil koleksi dan objek JSON menggunakan Axios, menggabungkan perubahan demo dari `localStorage`, dan menyediakan helper penyimpanan lokal. |
| `src/services/directoryService.js` | Mengambil data pengguna, karyawan, dan departemen melalui `mockDb`, lalu menggabungkan relasi datanya. |
| `src/services/payrollService.js` | Mengambil `payroll.json` dan `employees.json` menggunakan Fetch API, memeriksa respons dan format data, lalu menggabungkan data karyawan ke pembayaran. |
| `src/services/trackingService.js` | Mengambil `tracking.json` menggunakan Fetch API serta memeriksa koordinat dan data rute. |
| `src/services/attendanceService.js`, `employeeService.js`, `leaveService.js`, `settingsService.js`, `userService.js`, `authService.js` | Service untuk operasi fitur terkait. Service menggunakan data dari Mock API melalui `mockDb`/`directoryService`; perubahan demo disimpan di browser, bukan ke server. |
| Nager.Date Public Holidays API | `src/services/holidayService.js` meminta `https://date.nager.at/api/v3/PublicHolidays/{tahun}/ID` untuk tahun berjalan dan tahun berikutnya. Dashboard menampilkan libur nasional yang belum lewat; data tahun berjalan wajib tersedia, sedangkan kegagalan data tahun berikutnya tidak menghalangi daftar tahun berjalan. Request memakai helper `fetchJson` dari `src/services/apiClient.js` untuk timeout dan pesan error. |
| Tile OpenStreetMap | `src/TrackingPage.jsx` menggunakan Leaflet/React Leaflet dan tile `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` untuk menampilkan peta lokasi dan rute. Atribusi OpenStreetMap ditampilkan pada peta. Data koordinat/rute karyawan tetap berasal dari `public/mock/tracking.json`, bukan dari OpenStreetMap. |

Data notifikasi awal dan beberapa konten antarmuka demo masih ditetapkan di komponen, sedangkan data operasional utama pada tabel/halaman dimuat melalui service. API eksternal dipakai untuk informasi hari libur nasional dan tile peta, bukan untuk data payroll atau akun.

### 2.3 Requirements

| Requirement | Implementasi dan lokasi file |
|---|---|
| Semantic HTML5 dan accessibility | `src/components/AppLayout.jsx` menggunakan landmark navigasi, header, dan main. Halaman menggunakan elemen seperti `section`, `article`, `form`, dan `table`. Label, teks alternatif, atribut ARIA, tautan lewati konten, dan fokus keyboard digunakan pada komponen serta halaman terkait. |
| CSS, Flexbox, Grid, dan media queries | `src/App.css` berisi gaya aplikasi, tata letak Flexbox/Grid, dan breakpoint responsif. CSS khusus ada di `src/PayrollPage.css` dan `src/TrackingPage.css`; utilitas Tailwind juga dimuat lewat `src/tailwind.css`. |
| Responsive Design | Sidebar, menu profil/aksesibilitas, dan tombol tambah karyawan melayang menyesuaikan layar kecil melalui media queries di `src/App.css`; halaman payroll dan tracking memiliki aturan tata letak responsif di CSS masing-masing. |
| JavaScript ES6+ | Source menggunakan modul ES, komponen React, hooks, destructuring, arrow function, serta `async`/`await`; contoh implementasi data async ada di `src/services/`. |
| Validasi form sisi klien | Aturan reusable berada di `src/utils/validators.js` (`required`, email, kata sandi, NIK, dan lainnya). Aturan diterapkan, misalnya, di `src/pages/RegisterPage.jsx` dan `src/pages/EmployeeFormPage.jsx`. |
| Loading dan error states | `src/components/StateViews.jsx` menyediakan skeleton, loading state, dan error state dengan opsi coba lagi. Halaman data, seperti `src/pages/EmployeesPage.jsx`, `src/PayrollPage.jsx`, dan `src/TrackingPage.jsx`, juga memiliki state pemuatan/error sesuai kebutuhannya. |

### Sumber Data dan Penanganan Kondisi

Service memeriksa respons atau format data sesuai kebutuhan fitur, kemudian halaman menampilkan pesan yang dapat dipahami pengguna ketika permintaan gagal. Beberapa halaman menyediakan status pemuatan, tampilan error, dan tindakan coba lagi.

Perubahan data demo tertentu disimpan pada `localStorage` browser, bukan pada server. Gunakan browser dan profil penyimpanan yang sama untuk melihat perubahan lokal tersebut.

## Persyaratan

- Node.js versi 20.19+ atau 22.12+ dan npm.
- Koneksi internet diperlukan untuk memuat tile OpenStreetMap dan mengambil data hari libur nasional dari Nager.Date. Jika API eksternal tidak dapat diakses, fitur terkait menampilkan pesan error atau hanya data libur tahun berjalan sesuai ketersediaan respons.

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

Antarmuka menggunakan Flexbox dan CSS Grid untuk tata letak, serta media queries untuk menyesuaikan sidebar, menu akun, konten, dan komponen halaman pada ukuran layar berbeda. Navigasi mobile menyediakan kontrol buka/tutup sidebar. Menu profil menampilkan identitas akun, tautan profil, aksesibilitas, dan logout; kontrol aksesibilitas menggunakan panel lipat yang dapat dioperasikan dengan klik/keyboard. Tombol tambah karyawan tetap mudah dijangkau di kanan bawah pada layar kecil.

Implementasi aksesibilitas mencakup elemen HTML semantik, label form, teks alternatif gambar yang relevan, atribut ARIA untuk kontrol interaktif, tautan lewati ke konten utama, serta dukungan fokus dan navigasi keyboard.