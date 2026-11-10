import { loadDirectory } from './directoryService';
import { readCollection, saveRecord, nextId } from './mockDb';

const failure = (message, fieldErrors) => Object.assign(new Error(message), { friendly: true, fieldErrors });

const patchUser = async (id, changes) => {
  const users = await readCollection('users', 'id_pengguna');
  const current = users.find((u) => u.id_pengguna === Number(id));
  if (!current) throw failure('Akun tidak ditemukan.');
  return saveRecord('users', 'id_pengguna', { ...current, ...changes });
};

export const userService = {
  async list() {
    return loadDirectory();
  },

  async get(id) {
    const { users, departments } = await loadDirectory();
    const user = users.find((u) => u.id_pengguna === Number(id));
    if (!user) throw failure('Akun tidak ditemukan.');
    return { user, departments };
  },

  async create(values) {
    const [users, employees] = await Promise.all([
      readCollection('users', 'id_pengguna'),
      readCollection('karyawan', 'id_karyawan'),
    ]);
    const fieldErrors = {};
    if (users.some((u) => u.email.toLowerCase() === values.email.trim().toLowerCase())) fieldErrors.email = 'Email sudah dipakai.';
    if (values.role !== 'super_admin' && employees.some((e) => e.nik.toLowerCase() === values.nik.trim().toLowerCase())) fieldErrors.nik = 'NIK sudah dipakai.';
    if (Object.keys(fieldErrors).length) throw failure('Ada isian yang perlu diperbaiki.', fieldErrors);

    const id_pengguna = nextId(users, 'id_pengguna');
    const now = new Date().toISOString();
    saveRecord('users', 'id_pengguna', {
      id_pengguna, username: values.username?.trim() || values.nama_lengkap?.trim().toLowerCase().replace(/\s+/g, '.') || values.email.split('@')[0],
      email: values.email.trim(), password: values.password, role: values.role, status: 'aktif', status_persetujuan: 'approved',
      approved_by: 1, approved_at: now, created_at: now, terakhir_aktif: null,
    });
    if (values.role !== 'super_admin') {
      saveRecord('karyawan', 'id_karyawan', {
        id_karyawan: nextId(employees, 'id_karyawan'), id_pengguna, id_departemen: 1, id_atasan: null, nik: values.nik.trim(),
        nama_lengkap: values.nama_lengkap.trim(), jabatan: '', tanggal_masuk: null, no_telepon: '', alamat: '', jenis_kelamin: null,
        tanggal_lahir: null, status_kepegawaian: 'tetap', gaji_pokok: 0, sisa_cuti: 12, status: 'aktif',
        nama_bank: '', no_rekening: '', nama_pemilik_rekening: '', dokumen_ktp: false,
      });
    }
  },

  async update(id, values) {
    const users = await readCollection('users', 'id_pengguna');
    const current = users.find((u) => u.id_pengguna === Number(id));
    if (!current) throw failure('Akun tidak ditemukan.');
    if (users.some((u) => u.id_pengguna !== current.id_pengguna && u.email.toLowerCase() === values.email.trim().toLowerCase())) {
      throw failure('Ada isian yang perlu diperbaiki.', { email: 'Email sudah dipakai.' });
    }
    return saveRecord('users', 'id_pengguna', { ...current, email: values.email.trim(), username: values.username?.trim() || current.username, role: values.role });
  },

  async changePassword(id, newPassword) {
    const users = await readCollection('users', 'id_pengguna');
    const current = users.find((u) => u.id_pengguna === Number(id));
    if (!current) throw failure('Akun tidak ditemukan.');
    saveRecord('users', 'id_pengguna', { ...current, password: newPassword });
  },

  setStatus(id, status) {
    return patchUser(id, { status });
  },

  approve(id, approver) {
    return patchUser(id, { status_persetujuan: 'approved', approved_by: approver.id_pengguna, approved_at: new Date().toISOString() });
  },

  reject(id, approver) {
    return patchUser(id, { status_persetujuan: 'rejected', approved_by: approver.id_pengguna, approved_at: new Date().toISOString() });
  },
};
