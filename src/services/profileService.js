
import { loadDirectory } from './directoryService';
import { readCollection, saveRecord } from './mockDb';

const failure = (message, fieldErrors) =>
  Object.assign(new Error(message), { friendly: true, fieldErrors });

const validEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validPhone = (value) =>
  !value || /^[0-9+\-\s()]{8,20}$/.test(value);

const validBirthDate = (value) => {
  if (!value) return true;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date <= new Date();
};

const cleanUser = (user) => {
  if (!user) return null;
  const safe = { ...user };
  delete safe.password;
  return safe;
};

export const profileService = {
  async get(userId) {
    const { users } = await loadDirectory();

    const user = users.find(
      (item) => item.id_pengguna === Number(userId)
    );

    if (!user) throw failure('Data akun tidak ditemukan.');

    const { employee, ...account } = user;
    let safeEmployee = employee ? { ...employee } : null;

    if (safeEmployee) {
      delete safeEmployee.user;

      if (safeEmployee.supervisor) {
        safeEmployee.supervisor = {
          ...safeEmployee.supervisor,
        };
        delete safeEmployee.supervisor.user;
      }
    }

    return {
      user: cleanUser(account),
      employee: safeEmployee,
    };
  },

  async update(userId, values) {
    const [users, employees] = await Promise.all([
      readCollection('users', 'id_pengguna'),
      readCollection('karyawan', 'id_karyawan'),
    ]);

    const currentUser = users.find(
      (item) => item.id_pengguna === Number(userId)
    );

    if (!currentUser) {
      throw failure('Data akun tidak ditemukan.');
    }

    const employee = employees.find(
      (item) => item.id_pengguna === Number(userId)
    );

    const email = String(values.email ?? '').trim().toLowerCase();
    const displayName = String(values.nama_lengkap ?? '').trim();
    const phone = String(values.no_telepon ?? '').trim();
    const address = String(values.alamat ?? '').trim();
    const birthDate = values.tanggal_lahir || null;
    const gender = values.jenis_kelamin || null;
    const photo = values.foto_profil || null;

    const fieldErrors = {};

    if (!validEmail(email)) {
      fieldErrors.email = 'Masukkan alamat email yang valid.';
    }

    if (
      users.some(
        (item) =>
          item.id_pengguna !== Number(userId) &&
          item.email.toLowerCase() === email
      )
    ) {
      fieldErrors.email = 'Email sudah digunakan akun lain.';
    }

    if (displayName.length < 3) {
      fieldErrors.nama_lengkap = 'Nama minimal 3 karakter.';
    }

    if (displayName.length > 100) {
      fieldErrors.nama_lengkap = 'Nama maksimal 100 karakter.';
    }

    if (!validPhone(phone)) {
      fieldErrors.no_telepon = 'Nomor telepon tidak valid.';
    }

    if (address.length > 300) {
      fieldErrors.alamat = 'Alamat maksimal 300 karakter.';
    }

    if (!validBirthDate(birthDate)) {
      fieldErrors.tanggal_lahir =
        'Tanggal lahir tidak boleh melebihi hari ini.';
    }

    if (gender && !['L', 'P'].includes(gender)) {
      fieldErrors.jenis_kelamin = 'Jenis kelamin tidak valid.';
    }

    if (photo && !/^data:image\/(png|jpeg);base64,/.test(photo)) {
      fieldErrors.foto_profil = 'Foto harus berupa PNG atau JPG.';
    }

    if (photo && photo.length > 1500000) {
      fieldErrors.foto_profil = 'Ukuran foto maksimal 1 MB.';
    }

    if (Object.keys(fieldErrors).length) {
      throw failure('Ada data yang perlu diperbaiki.', fieldErrors);
    }

    const updatedUser = {
      ...currentUser,
      email,
      ...(employee ? {} : { username: displayName }),
      ...(employee ? {} : { foto_profil: photo }),
    };

    saveRecord('users', 'id_pengguna', updatedUser);

    if (employee) {
      saveRecord('karyawan', 'id_karyawan', {
        ...employee,
        nama_lengkap: displayName,
        no_telepon: phone,
        alamat: address,
        tanggal_lahir: birthDate,
        jenis_kelamin: gender,
        foto_profil: photo,
      });
    }

    return this.get(userId);
  },

  async changePassword(userId, currentPassword, newPassword) {
    const users = await readCollection('users', 'id_pengguna');

    const user = users.find(
      (item) => item.id_pengguna === Number(userId)
    );

    if (!user) throw failure('Data akun tidak ditemukan.');

    if (!currentPassword || currentPassword !== user.password) {
      throw failure('Password saat ini tidak sesuai.');
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw failure('Password baru minimal 8 karakter.');
    }

    if (newPassword.length > 72) {
      throw failure('Password baru maksimal 72 karakter.');
    }

    if (newPassword === currentPassword) {
      throw failure(
        'Password baru harus berbeda dari password saat ini.'
      );
    }

    saveRecord('users', 'id_pengguna', {
      ...user,
      password: newPassword,
    });

    return true;
  },
};