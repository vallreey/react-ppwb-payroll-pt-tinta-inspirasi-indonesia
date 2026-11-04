# Spesifikasi Tugas Besar I (UTS) — Perancangan dan Pemrograman Web

> Fakultas Informatika, Telkom University
> Dokumen ini adalah spesifikasi tugas yang dijadikan acuan (brief) untuk AI/asisten coding. Semua pekerjaan harus memenuhi ketentuan dan rubrik di bawah.

## Instruksi untuk AI

- Baca seluruh dokumen ini sebelum menulis kode. Rubrik penilaian (bagian 6 dan 7) adalah target kualitas: kerjakan agar mencapai kolom nilai tertinggi.
- Bahasa komunikasi, komentar penting, README, dan laporan: **Bahasa Indonesia**.
- Aplikasi yang dibuat adalah aplikasi web yang ditentukan kelompok sejak pekan pertama; ikuti topik dan fitur yang diberikan pengguna, jangan menambah fitur di luar itu.
- Jangan hardcode data langsung ke komponen. Semua data harus diambil lewat `fetch` atau `axios`.
- Jangan ada error di console browser.

## 1. Deskripsi Umum

Tugas besar ini adalah evaluasi praktik **frontend development** dengan fokus pada antarmuka pengguna yang **responsif**, **accessible**, dan **terintegrasi dengan API eksternal**.

Setiap kelompok membuat sebagian besar tampilan dari aplikasi web yang telah ditentukan sejak pekan pertama. Aplikasi harus:

- [ ] Terdiri dari **minimal 5–7 halaman** yang saling terkoneksi
- [ ] Menggunakan framework JavaScript modern (React.js, Vue.js, Svelte, Next, atau framework JS family lainnya)
- [ ] Mengonsumsi **Mock API** atau **API eksternal** untuk menampilkan data dinamis
- [ ] Menerapkan **responsive design** dan **accessibility** dasar

## 2. Teknologi dan Requirements

### 2.1 Frontend Stack

| Aspek | Pilihan yang diperbolehkan |
|---|---|
| Framework | React.js, Vue.js, Svelte, Next, atau framework JS family lainnya |
| Styling / component library | CSS + Flexbox + Grid (boleh dikombinasikan dengan Tailwind), **atau** Material UI (MUI) |
| HTTP Client | Fetch API atau Axios |

### 2.2 Data Source

Data diambil menggunakan Fetch API atau Axios dari salah satu sumber berikut:

- **Public API** — API asli dari service eksternal
- **Mock API** — file JSON di dalam project, atau JSONPlaceholder
- **Hardcoded JSON** — boleh, **tetapi harus di-fetch**, bukan langsung di-render

### 2.3 Requirements

- [ ] Semantic HTML5 dan Accessibility
- [ ] CSS (Flexbox, Grid, Media Queries)
- [ ] Responsive Design
- [ ] ES6+ JavaScript
- [ ] Form validation (client-side)
- [ ] Loading dan Error states pada UI

## 3. Ketentuan Pengerjaan

- Dikerjakan **berkelompok**.
- Penilaian terdiri dari **Kelompok (25 poin)** dan **Individu (75 poin)**, total **100 poin**.

## 4. Dokumentasi dan Submission

Setiap kelompok mengumpulkan:

1. **Di LMS:** laporan PDF/Word berisi deskripsi, links, members, screenshots, dan setup instructions.
2. **Per individu:** screenshot halaman yang dibuat + penjelasan HTML/CSS/JavaScript/API.

## 5. Ringkasan Bobot Penilaian

| Kategori | Poin |
|---|---|
| Kelompok (Repository & Git 5, Laporan & Dokumentasi 5, Integrasi & Fungsionalitas 15) | 25 |
| Individu (Git 10, Framework 15, HTML Semantics & Accessibility 12, CSS & Responsive 12, API & Functionality 10, Code Quality 10, Design & UX 6) | 75 |
| **Total** | **100** |

## 6. Rubrik Penilaian Kelompok (25 Poin)

### 6.1 Repository & Git (5 poin)

| Kriteria | 0 pts | 1–2 pts | 3–4 pts | 5 pts |
|---|---|---|---|---|
| Public Access | Private / tidak ada | Private | Public, setup unclear | Public, setup clear |
| Commit History | Tidak ada | < 5, unclear | 5–10, some clear | 15+, descriptive |
| .gitignore & README | Tidak ada | .gitignore saja | README incomplete | README lengkap |
| Branch Strategy | Semua di main | Chaotic | Mostly organized | Clean |

### 6.2 Laporan & Documentation (5 poin)

| Kriteria | 0 pts | 1–2 pts | 3–4 pts | 5 pts |
|---|---|---|---|---|
| Content | Tidak ada | Deskripsi saja | Desc + links | Lengkap + tech stack |
| Screenshots | Tidak ada | Blur / unclear | Clear, minimal desc | Perfect + excellent desc |
| Setup Instructions | Tidak ada | Vague | Basic steps | Detailed & clear |

### 6.3 Integrasi & Fungsionalitas (15 poin)

| Kriteria | 0 pts | 3–5 pts | 8–11 pts | 12–15 pts |
|---|---|---|---|---|
| Pages Connected | Tidak | Beberapa | Mayoritas | Semua + smooth nav |
| API Data Display | Tidak | Hardcoded | Partial fetch | Dynamic correct |
| Feature Completeness | Broken | 50% working | 90% working | 100% working |
| Error Handling | Tidak | Basic | Good | Comprehensive |

## 7. Rubrik Penilaian Individu (75 Poin)

### 7.1 Git & Version Control (10 poin)

| Kriteria | 0 pts | 2–3 pts | 5–8 pts | 9–10 pts |
|---|---|---|---|---|
| Commit Messages | Tidak ada | Vague | Basic clear | Excellent descriptive |
| Commit Frequency | Tidak ada | < 5 | 5–10 | 15+ meaningful |
| Branch Usage | All main | Chaotic | Organized | Professional |

### 7.2 Framework Implementation (15 poin)

| Kriteria | 0 pts | 3–5 pts | 8–12 pts | 13–15 pts |
|---|---|---|---|---|
| Framework & Structure | Tidak | Vanilla JS basic | Framework proper | Framework best practices |
| Component Architecture | No structure | Minimal components | Good reusability | Excellent component design |
| State & Props | Tidak ada | Basic usage | Good management | Professional patterns |

### 7.3 HTML Semantics & Accessibility (12 poin)

| Kriteria | 0 pts | 2–4 pts | 6–9 pts | 10–12 pts |
|---|---|---|---|---|
| Semantic HTML | Hanya div | Beberapa semantic tags | Mostly semantic | Excellent semantic |
| Accessibility | Tidak ada | Minimal | Good implementation | Comprehensive accessibility |
| Keyboard Navigation | Tidak support | Partial support | Mostly functional | Fully functional |

### 7.4 Modern CSS & Responsive Design (12 poin)

| Kriteria | 0 pts | 2–4 pts | 6–9 pts | 10–12 pts |
|---|---|---|---|---|
| Flexbox/Grid Usage | Tidak ada | Float/positioning | Basic Flexbox/Grid | Expert usage |
| Media Queries | Tidak ada | 1–2 queries | 3–5 queries | Comprehensive breakpoints |
| Responsiveness | Not responsive | Mobile only | Most devices ok | Perfect all devices |

### 7.5 API & Functionality (10 poin)

| Kriteria | 0 pts | 2–3 pts | 5–8 pts | 9–10 pts |
|---|---|---|---|---|
| Data Fetching | Data hardcoded, tidak di-fetch | Fetch ada tapi inconsistent / masih ada hardcoded tanpa fetch | Semua data dari fetch (Mock/Public API) | Clean fetch implementation, reusable |
| Error Handling | Tidak ada | Minimal (console.log saja) | Error handling implemented (try-catch) | Comprehensive, user-friendly messages |
| Loading/Error States | Tidak ada | Partial (hanya loading atau error) | Both implemented (loading & error states) | Professional UX (skeleton, retry, clear messages) |

### 7.6 Code Quality & Organization (10 poin)

| Kriteria | 0 pts | 2–3 pts | 5–8 pts | 9–10 pts |
|---|---|---|---|---|
| Console Errors | Banyak | Beberapa | Clean | Completely clean |
| Folder Structure | Disorganized | Basic | Well-organized | Excellent architecture |
| DRY Principle | Much duplication | Some duplication | Good DRY | Excellent reusability |

### 7.7 Design & UX (6 poin)

| Kriteria | 0 pts | 1–2 pts | 3–4 pts | 5–6 pts |
|---|---|---|---|---|
| Visual Consistency | Inconsistent | Mostly inconsistent | Good consistency | Excellent consistency |
| Design Quality | Unreadable | Poor choices | Good design | Professional design |
| User Experience | Confusing | Hard to navigate | Good UX | Intuitive & smooth |

## 8. Checklist Target Nilai Maksimal untuk AI

**Struktur dan framework**
- [ ] Framework dipakai dengan best practice (React: komponen fungsional, hooks, routing antar halaman)
- [ ] Komponen kecil dan reusable; state dan props dikelola dengan pola profesional
- [ ] Struktur folder jelas (mis. `components/`, `pages/`, `services/` atau `api/`, `hooks/`, `utils/`)
- [ ] Prinsip DRY: tidak ada duplikasi kode; logika fetch dibuat reusable (service / custom hook)

**API dan data**
- [ ] Seluruh data berasal dari `fetch`/`axios` (tidak ada data yang langsung di-render)
- [ ] Setiap request dibungkus `try-catch` dengan pesan error yang ramah pengguna
- [ ] Ada state **loading** (idealnya skeleton) dan state **error** (dengan tombol retry)

**HTML, aksesibilitas, CSS**
- [ ] Semantic HTML5 (`header`, `nav`, `main`, `section`, `article`, `footer`, dll.), bukan hanya `div`
- [ ] Aksesibilitas menyeluruh: `alt`, label form, `aria-*` yang tepat, kontras warna, focus state terlihat
- [ ] Keyboard navigation berfungsi penuh (tab order logis, tidak ada keyboard trap)
- [ ] Flexbox dan Grid dipakai secara mahir
- [ ] Media queries dengan breakpoint komprehensif (mobile, tablet, desktop)
- [ ] Responsif sempurna di semua ukuran perangkat

**Form dan UX**
- [ ] Validasi form sisi klien dengan pesan error yang jelas
- [ ] Desain konsisten (palet warna, tipografi, spacing) dan navigasi antar halaman mulus
- [ ] Minimal 5–7 halaman yang saling terhubung

**Kualitas kode**
- [ ] Console browser bersih (tanpa error maupun warning)
- [ ] JavaScript ES6+ (arrow function, destructuring, async/await, modules)

**Git dan dokumentasi**
- [ ] Repository public, ada `.gitignore`
- [ ] `README.md` lengkap: deskripsi, tech stack, link, anggota, screenshot, langkah setup yang detail
- [ ] Commit sering (15+), pesan commit deskriptif
- [ ] Branch rapi (mis. `main`, `develop`, `feature/*`), tidak semua langsung di `main`
