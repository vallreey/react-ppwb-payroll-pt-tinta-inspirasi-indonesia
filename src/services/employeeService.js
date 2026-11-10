import { loadDirectory } from './directoryService';
import { readCollection, saveRecord, nextId } from './mockDb';

const failure = (message, fieldErrors) => Object.assign(new Error(message), { friendly: true, fieldErrors });

export const employeeService = {
  async list() {
    const { employees, departments } = await loadDirectory();
    return {
      departments,
      employees: employees
        .filter((e) => e.user?.status_persetujuan === 'approved')
        .map((e) => ({ ...e, status_tampil: e.user?.status === 'nonaktif' ? 'nonaktif' : e.status })),
    };
  },

  async get(id) {
    const { employees, departments } = await loadDirectory();
    const employee = employees.find((e) => e.id_karyawan === Number(id));
    if (!employee) throw failure('Data karyawan tidak ditemukan.');
    return { employee, departments, supervisors: employees.filter((e) => ['supervisor', 'direktur', 'hrd'].includes(e.user?.role) && e.id_karyawan !== employee.id_karyawan) };
  },

  async formOptions() {
    const { employees, departments } = await loadDirectory();
    return { departments, supervisors: employees.filter((e) => ['supervisor', 'direktur', 'hrd'].includes(e.user?.role)) };
  },

  async create(values) {
    const [users, employees] = await Promise.all([
      readCollection('users', 'id_pengguna'),
      readCollection('karyawan', 'id_karyawan'),
    ]);
    const fieldErrors = {};
    if (users.some((u) => u.email.toLowerCase() === values.email.trim().toLowerCase())) fieldErrors.email = 'Email sudah dipakai.';
    if (employees.some((e) => e.nik.toLowerCase() === values.nik.trim().toLowerCase())) fieldErrors.nik = 'NIK sudah dipakai.';
    if (Object.keys(fieldErrors).length) throw failure('Ada isian yang perlu diperbaiki.', fieldErrors);

    const id_pengguna = nextId(users, 'id_pengguna');
    saveRecord('users', 'id_pengguna', {
      id_pengguna, username: values.nama_lengkap.trim().toLowerCase().replace(/\s+/g, '.'), email: values.email.trim(),
      password: values.password, role: values.role || 'karyawan', status: 'aktif', status_persetujuan: 'approved',
      approved_by: 1, approved_at: new Date().toISOString(), created_at: new Date().toISOString(), terakhir_aktif: null,
    });
    return saveRecord('karyawan', 'id_karyawan', {
      ...toEmployeeRecord(values), id_karyawan: nextId(employees, 'id_karyawan'), id_pengguna, status: 'aktif', dokumen_ktp: Boolean(values.dokumen_ktp),
    });
  },

  async update(id, values) {
    const employees = await readCollection('karyawan', 'id_karyawan');
    const current = employees.find((e) => e.id_karyawan === Number(id));
    if (!current) throw failure('Data karyawan tidak ditemukan.');
    if (employees.some((e) => e.id_karyawan !== current.id_karyawan && e.nik.toLowerCase() === values.nik.trim().toLowerCase())) {
      throw failure('Ada isian yang perlu diperbaiki.', { nik: 'NIK sudah dipakai.' });
    }
    return saveRecord('karyawan', 'id_karyawan', {
      ...current, ...toEmployeeRecord(values), dokumen_ktp: values.dokumen_ktp || current.dokumen_ktp,
    });
  },

  async setStatus(id, status) {
    const [users, employees] = await Promise.all([
      readCollection('users', 'id_pengguna'),
      readCollection('karyawan', 'id_karyawan'),
    ]);
    const employee = employees.find((e) => e.id_karyawan === Number(id));
    const user = users.find((u) => u.id_pengguna === employee?.id_pengguna);
    if (!employee || !user) throw failure('Data karyawan tidak ditemukan.');
    saveRecord('karyawan', 'id_karyawan', { ...employee, status });
    saveRecord('users', 'id_pengguna', { ...user, status });
  },
};

const toEmployeeRecord = (v) => ({
  id_departemen: v.id_departemen ? Number(v.id_departemen) : null,
  id_atasan: v.id_atasan ? Number(v.id_atasan) : null,
  nik: v.nik.trim(),
  nama_lengkap: v.nama_lengkap.trim(),
  jabatan: v.jabatan?.trim() ?? '',
  tanggal_masuk: v.tanggal_masuk || null,
  no_telepon: v.no_telepon ?? '',
  alamat: v.alamat ?? '',
  jenis_kelamin: v.jenis_kelamin || null,
  tanggal_lahir: v.tanggal_lahir || null,
  status_kepegawaian: v.status_kepegawaian,
  gaji_pokok: Number(v.gaji_pokok) || 0,
  sisa_cuti: Number(v.sisa_cuti) || 0,
  nama_bank: v.nama_bank ?? '',
  no_rekening: v.no_rekening ?? '',
  nama_pemilik_rekening: v.nama_pemilik_rekening ?? '',
});
