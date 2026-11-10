import { readCollection, saveRecord, nextId, sessionStore } from './mockDb';
import { loadDirectory } from './directoryService';

const failure = (message) => Object.assign(new Error(message), { friendly: true });

export const authService = {
  async login({ email, password }) {
    const users = await readCollection('users', 'id_pengguna');
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw failure('Email atau password salah.');
    if (user.status !== 'aktif') throw failure('Akun Anda dinonaktifkan. Hubungi Super Admin.');
    if (user.status_persetujuan === 'pending') throw failure('Akun Anda masih menunggu persetujuan Super Admin.');
    if (user.status_persetujuan === 'rejected') throw failure('Registrasi akun Anda ditolak. Hubungi HRD.');
    saveRecord('users', 'id_pengguna', { ...user, terakhir_aktif: new Date().toISOString() });
    sessionStore.set(user.id_pengguna);
    return this.restore();
  },

  async restore() {
    const id = Number(sessionStore.get());
    if (!id) return null;
    const { users } = await loadDirectory();
    const user = users.find((u) => u.id_pengguna === id);
    if (!user || user.status !== 'aktif' || user.status_persetujuan !== 'approved') {
      sessionStore.clear();
      return null;
    }
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  },

  logout() {
    sessionStore.clear();
  },

  async register({ name, nik, email, password }) {
    const [users, employees] = await Promise.all([
      readCollection('users', 'id_pengguna'),
      readCollection('karyawan', 'id_karyawan'),
    ]);
    const errors = {};
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) errors.email = 'Email sudah terdaftar.';
    if (employees.some((e) => e.nik.toLowerCase() === nik.trim().toLowerCase())) errors.nik = 'NIK sudah terdaftar.';
    if (Object.keys(errors).length) throw Object.assign(failure('Data pendaftaran tidak valid.'), { fieldErrors: errors });

    const id_pengguna = nextId(users, 'id_pengguna');
    saveRecord('users', 'id_pengguna', {
      id_pengguna, username: name.trim().toLowerCase().replace(/\s+/g, '.'), email: email.trim(), password,
      role: 'karyawan', status: 'aktif', status_persetujuan: 'pending', approved_by: null, approved_at: null,
      created_at: new Date().toISOString(), terakhir_aktif: null,
    });
    saveRecord('karyawan', 'id_karyawan', {
      id_karyawan: nextId(employees, 'id_karyawan'), id_pengguna, id_departemen: 1, id_atasan: null, nik: nik.trim(),
      nama_lengkap: name.trim(), jabatan: '', tanggal_masuk: null, no_telepon: '', alamat: '', jenis_kelamin: null,
      tanggal_lahir: null, status_kepegawaian: 'percobaan', gaji_pokok: 0, sisa_cuti: 12, status: 'aktif',
      nama_bank: '', no_rekening: '', nama_pemilik_rekening: '', dokumen_ktp: false,
    });
  },
};
