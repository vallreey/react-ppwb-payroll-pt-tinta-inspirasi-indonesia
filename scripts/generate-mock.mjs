import { writeFileSync } from 'node:fs';

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pad = (n) => String(n).padStart(2, '0');
const out = (name, data) => writeFileSync(`public/mock/${name}.json`, JSON.stringify(data, null, 2));

const departments = ['General', 'Marketing', 'Creative', 'Teknis Lapangan', 'Administrasi']
  .map((nama_departemen, i) => ({ id_departemen: i + 1, nama_departemen }));

const people = [
  ['Dewi Lestari', 'direktur', 1, 'CEO / Direktur', null, 'P', 'tetap'],
  ['Rina Kusuma', 'hrd', 5, 'HRD Manager', null, 'P', 'tetap'],
  ['Bagas Wicaksono', 'supervisor', 2, 'Supervisor Marketing', null, 'L', 'tetap'],
  ['Eka Bayu Wiguna', 'supervisor', 4, 'Supervisor Lapangan', null, 'L', 'tetap'],
  ['Putri Anggraini', 'supervisor', 3, 'Creative Lead', null, 'P', 'tetap'],
  ['Ageng Saputro', 'karyawan', 2, 'Marketing Executive', 3, 'L', 'tetap'],
  ['Rizky Pratama', 'karyawan', 2, 'Digital Marketer', 3, 'L', 'kontrak'],
  ['Nadia Putri', 'karyawan', 3, 'Graphic Designer', 5, 'P', 'tetap'],
  ['Fajar Nugraha', 'karyawan', 3, 'Content Creator', 5, 'L', 'percobaan'],
  ['Dimas Pratama', 'karyawan', 4, 'Teknisi Lapangan', 4, 'L', 'kontrak'],
  ['Rani Permata', 'karyawan', 5, 'Staf Administrasi', 2, 'P', 'tetap'],
  ['Yoga Firmansyah', 'karyawan', 4, 'Teknisi Lapangan', 4, 'L', 'percobaan'],
];
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '.');

const users = [{
  id_pengguna: 1, username: 'superadmin', email: 'superadmin@tintainspirasi.co.id', password: 'ChangeMe123!',
  role: 'super_admin', status: 'aktif', status_persetujuan: 'approved', approved_by: null,
  approved_at: '2026-01-05T08:00:00', created_at: '2026-01-05T08:00:00', terakhir_aktif_menit: 5,
}];
const employees = [];
people.forEach(([nama, role, dep, jabatan, atasan, jk, sk], i) => {
  const id = i + 2;
  const empId = i + 1;
  users.push({
    id_pengguna: id, username: slug(nama), email: `${slug(nama)}@tintainspirasi.co.id`, password: 'Password123',
    role, status: 'aktif', status_persetujuan: 'approved', approved_by: 1,
    approved_at: '2026-01-10T09:00:00', created_at: '2026-01-10T08:30:00', terakhir_aktif_menit: 20 + i * 47,
  });
  employees.push({
    id_karyawan: empId, id_pengguna: id, id_departemen: dep, id_atasan: atasan, nik: `TI-2026-${pad(empId)}`,
    nama_lengkap: nama, jabatan, tanggal_masuk: `2025-${pad(1 + (i % 12))}-${pad(3 + i)}`,
    no_telepon: `0812${Math.floor(10000000 + rnd() * 89999999)}`, alamat: `Jl. Merdeka No. ${10 + i}, Bandung`,
    jenis_kelamin: jk, tanggal_lahir: `${1992 + (i % 8)}-${pad(1 + (i % 12))}-${pad(5 + i)}`, status_kepegawaian: sk,
    gaji_pokok: 5000000 + Math.floor(rnd() * 8) * 750000, sisa_cuti: 12 - (i % 5), status: 'aktif',
    nama_bank: pick(['BCA', 'BNI', 'Mandiri', 'BRI']), no_rekening: String(Math.floor(1e9 + rnd() * 9e9)),
    nama_pemilik_rekening: nama, dokumen_ktp: i % 3 !== 0,
  });
});
const extra = [
  ['Hendra Gunawan', 'aktif-nonaktif', 'karyawan', 'nonaktif', 'approved', 4, 'Teknisi Lapangan', 'L'],
  ['Salsa Maharani', 'x', 'karyawan', 'aktif', 'pending', 2, 'Staf Baru', 'P'],
  ['Bima Prakoso', 'x', 'karyawan', 'aktif', 'pending', 3, 'Staf Baru', 'L'],
  ['Citra Maharani', 'x', 'karyawan', 'aktif', 'rejected', 5, 'Staf Baru', 'P'],
];
extra.forEach(([nama, , role, status, appr, dep, jabatan, jk], k) => {
  const id = users.length + 1;
  const empId = employees.length + 1;
  users.push({
    id_pengguna: id, username: slug(nama), email: `${slug(nama)}@mail.com`, password: 'Password123', role,
    status, status_persetujuan: appr, approved_by: appr === 'pending' ? null : 1,
    approved_at: appr === 'pending' ? null : '2026-03-01T10:00:00', created_at: `2026-1${k % 2}-0${2 + k}T10:15:00`,
    terakhir_aktif_menit: null,
  });
  employees.push({
    id_karyawan: empId, id_pengguna: id, id_departemen: dep, id_atasan: null, nik: `REG-${pad(empId)}${pad(k + 1)}`,
    nama_lengkap: nama, jabatan, tanggal_masuk: null, no_telepon: '', alamat: '', jenis_kelamin: jk, tanggal_lahir: null,
    status_kepegawaian: 'percobaan', gaji_pokok: 0, sisa_cuti: 12, status, nama_bank: '', no_rekening: '',
    nama_pemilik_rekening: '', dokumen_ktp: false,
  });
});

const attendance = [];
let attId = 1;
const noRecordToday = new Set([9, 12]);
employees.filter((e) => e.status === 'aktif' && users[e.id_pengguna - 1].status_persetujuan === 'approved').forEach((e) => {
  for (let d = 0; d < 10; d++) {
    if (d === 0 && noRecordToday.has(e.id_karyawan)) continue;
    if (d > 0 && rnd() < 0.07) continue;
    const late = rnd() < 0.22;
    const inMin = late ? 9 * 60 + 5 + Math.floor(rnd() * 50) : 8 * 60 + 15 + Math.floor(rnd() * 44);
    const outMin = 16 * 60 + Math.floor(rnd() * 70);
    const done = d > 0 || rnd() < 0.3;
    const approved = d >= 3 ? 'approved' : d === 0 ? 'pending' : pick(['approved', 'pending', 'approved']);
    attendance.push({
      id_absensi: attId++, id_karyawan: e.id_karyawan, hari_lalu: d,
      jam_masuk: `${pad(Math.floor(inMin / 60))}:${pad(inMin % 60)}:00`,
      jam_keluar: done ? `${pad(Math.floor(outMin / 60))}:${pad(outMin % 60)}:00` : null,
      lat_masuk: -6.9175 + (rnd() - 0.5) * 0.002, long_masuk: 107.6191 + (rnd() - 0.5) * 0.002,
      status: late ? 'terlambat' : 'hadir', status_persetujuan: approved, foto: true,
    });
  }
});

const settings = {
  nama_perusahaan: 'PT. Tinta Inspirasi Indonesia',
  work_start: '09:00', work_end: '16:00', early_minutes: 30, work_days: [1, 2, 3, 4, 5],
  office_lat: -6.9175, office_long: 107.6191,
};

out('departments', departments);
out('users', users);
out('karyawan', employees);
out('attendance', attendance);
out('settings', settings);
console.log({ users: users.length, employees: employees.length, attendance: attendance.length });
