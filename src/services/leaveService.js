
import { loadDirectory } from './directoryService';
import { nextId, readCollection, saveRecord } from './mockDb';
import { toISODate } from '../utils/format';

const APPROVER_ROLES = ['super_admin', 'hrd'];
const SUBMITTER_ROLES = ['karyawan', 'supervisor', 'hrd'];

const LEAVE_TYPES = [
  'Sakit',
  'Cuti Tahunan',
  'Menikah',
  'Izin Pribadi',
  'Izin Keluarga',
];

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
];

const failure = (message) =>
  Object.assign(new Error(message), { friendly: true });

const countDays = (start, end) => {
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);

  return Math.max(
    1,
    Math.round((to - from) / 86400000) + 1
  );
};

const validDate = (value) => {
  const date = new Date(`${value}T00:00:00`);

  return (
    !Number.isNaN(date.getTime()) &&
    toISODate(date) === value
  );
};

const getPrefix = (type) => ({
  Sakit: 'S',
  'Cuti Tahunan': 'C',
  Menikah: 'N',
  'Izin Pribadi': 'I',
  'Izin Keluarga': 'I',
}[type] ?? 'I');

export const canManageLeave = (user) =>
  Boolean(user && APPROVER_ROLES.includes(user.role));

export const canSubmitLeave = (user) =>
  Boolean(user && SUBMITTER_ROLES.includes(user.role));

export const leaveService = {
  async list(user) {
    if (!canManageLeave(user)) {
      throw failure('Anda tidak memiliki akses.');
    }

    const [{ employees, departments }, requests] =
      await Promise.all([
        loadDirectory(),
        readCollection('leaveRequests', 'id_pengajuan'),
      ]);

    const employeeById = new Map(
      employees.map((employee) => [
        employee.id_karyawan,
        employee,
      ])
    );

    const rows = requests
      .filter((request) =>
        employeeById.has(request.id_karyawan)
      )
      .map((request) => ({
        ...request,
        employee: employeeById.get(request.id_karyawan),
        canProcess:
          request.status === 'pending' &&
          employeeById.get(request.id_karyawan)
            ?.id_pengguna !== user.id_pengguna,
      }))
      .sort((a, b) =>
        (b.created_at ?? '').localeCompare(
          a.created_at ?? ''
        )
      );

    return { rows, departments };
  },

  async listMine(user) {
    if (!canSubmitLeave(user)) {
      throw failure('Anda tidak memiliki akses pengajuan.');
    }

    const [{ employees }, requests] =
      await Promise.all([
        loadDirectory(),
        readCollection('leaveRequests', 'id_pengajuan'),
      ]);

    const employee = employees.find(
      (item) => item.id_pengguna === user.id_pengguna
    );

    if (!employee) {
      throw failure('Profil karyawan tidak ditemukan.');
    }

    const rows = requests
      .filter(
        (request) =>
          request.id_karyawan === employee.id_karyawan
      )
      .sort((a, b) =>
        (b.created_at ?? '').localeCompare(
          a.created_at ?? ''
        )
      );

    return { employee, rows };
  },

  async create(user, payload) {
    if (!canSubmitLeave(user)) {
      throw failure('Role tidak memiliki akses pengajuan.');
    }

    const { employees } = await loadDirectory();

    const employee = employees.find(
      (item) => item.id_pengguna === user.id_pengguna
    );

    if (!employee || employee.status !== 'aktif') {
      throw failure('Profil karyawan aktif tidak ditemukan.');
    }

    const {
      jenis,
      tanggal_mulai,
      tanggal_selesai,
      jam_mulai,
      jam_selesai,
      deskripsi,
    } = payload;

    const lampiran = Array.isArray(payload.lampiran)
      ? payload.lampiran
      : [];

    if (!LEAVE_TYPES.includes(jenis)) {
      throw failure('Jenis pengajuan tidak valid.');
    }

    if (
      !validDate(tanggal_mulai) ||
      !validDate(tanggal_selesai)
    ) {
      throw failure('Tanggal pengajuan tidak valid.');
    }

    if (tanggal_selesai < tanggal_mulai) {
      throw failure('Tanggal selesai tidak boleh lebih awal.');
    }

    if (
      jenis !== 'Sakit' &&
      tanggal_mulai < toISODate()
    ) {
      throw failure('Tanggal pengajuan tidak boleh melewati hari ini.');
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(jam_mulai) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(jam_selesai)
    ) {
      throw failure('Jam pengajuan tidak valid.');
    }

    if (
      tanggal_mulai === tanggal_selesai &&
      jam_selesai <= jam_mulai
    ) {
      throw failure('Jam selesai harus lebih besar dari jam mulai.');
    }

    if (!deskripsi || deskripsi.trim().length < 10) {
      throw failure('Deskripsi minimal 10 karakter.');
    }

    if (deskripsi.length > 1000) {
      throw failure('Deskripsi maksimal 1.000 karakter.');
    }

    if (lampiran.length > 2) {
      throw failure('Lampiran maksimal 2 file.');
    }

    let totalSize = 0;

    for (const file of lampiran) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw failure('Lampiran hanya boleh PNG, JPG, atau PDF.');
      }

      if (
        !file.file_name ||
        !String(file.url ?? '').startsWith('data:')
      ) {
        throw failure('File lampiran tidak dapat dibaca.');
      }

      const size = Math.floor(file.url.length * 3 / 4);

      if (size > 700 * 1024) {
        throw failure('Ukuran setiap file maksimal 700 KB.');
      }

      totalSize += size;
    }

    if (totalSize > 1200 * 1024) {
      throw failure('Total lampiran maksimal 1,2 MB.');
    }

    const requests = await readCollection(
      'leaveRequests',
      'id_pengajuan'
    );

    const days = countDays(
      tanggal_mulai,
      tanggal_selesai
    );

    if (jenis === 'Cuti Tahunan') {
      const reservedDays = requests
        .filter((request) =>
          request.id_karyawan === employee.id_karyawan &&
          request.jenis === 'Cuti Tahunan' &&
          request.status === 'pending'
        )
        .reduce(
          (sum, request) =>
            sum + countDays(
              request.tanggal_mulai,
              request.tanggal_selesai
            ),
          0
        );

      const available = Math.max(
        0,
        Number(employee.sisa_cuti ?? 0) - reservedDays
      );

      if (days > available) {
        throw failure(
          `Sisa cuti yang tersedia hanya ${available} hari.`
        );
      }
    }

    const overlap = requests.some((request) =>
      request.id_karyawan === employee.id_karyawan &&
      ['pending', 'approved'].includes(request.status) &&
      request.tanggal_mulai <= tanggal_selesai &&
      request.tanggal_selesai >= tanggal_mulai
    );

    if (overlap) {
      throw failure(
        'Tanggal bertabrakan dengan pengajuan lain yang masih aktif.'
      );
    }

    const prefix = getPrefix(jenis);

    const lastSequence = requests.reduce((max, request) => {
      const match = String(request.kode ?? '')
        .match(new RegExp(`^${prefix}-(\\d+)$`));

      return match
        ? Math.max(max, Number(match[1]))
        : max;
    }, 0);

    const record = {
      id_pengajuan: nextId(requests, 'id_pengajuan'),
      id_karyawan: employee.id_karyawan,

      kode: `${prefix}-${String(lastSequence + 1).padStart(3, '0')}`,

      jenis,
      tanggal_mulai,
      tanggal_selesai,
      jam_mulai,
      jam_selesai,
      deskripsi: deskripsi.trim(),

      lampiran: lampiran.map((file, index) => ({
        label: `Bukti ${index + 1}`,
        file_name: String(file.file_name).slice(0, 120),
        type: file.type,
        url: file.url,
      })),

      status: 'pending',
      created_at: new Date().toISOString(),
      decided_at: null,
      decided_by: null,
      rejection_reason: null,
    };

    return saveRecord(
      'leaveRequests',
      'id_pengajuan',
      record
    );
  },

  async decide(user, id, decision, reason = '') {
    if (!canManageLeave(user)) {
      throw failure('Hanya HRD dan Super Admin yang dapat memproses pengajuan.');
    }

    if (!['approved', 'rejected'].includes(decision)) {
      throw failure('Keputusan pengajuan tidak valid.');
    }

    if (decision === 'rejected' && !reason.trim()) {
      throw failure('Alasan penolakan wajib diisi.');
    }

    const requests = await readCollection(
      'leaveRequests',
      'id_pengajuan'
    );

    const request = requests.find(
      (item) => item.id_pengajuan === Number(id)
    );

    if (!request) {
      throw failure('Pengajuan tidak ditemukan.');
    }

    if (request.status !== 'pending') {
      throw failure('Pengajuan sudah diproses.');
    }

    const { employees } = await loadDirectory();

    const employee = employees.find(
      (item) => item.id_karyawan === request.id_karyawan
    );

    if (employee?.id_pengguna === user.id_pengguna) {
      throw failure('Anda tidak dapat memproses pengajuan milik sendiri.');
    }

    if (
      decision === 'approved' &&
      request.jenis === 'Cuti Tahunan'
    ) {
      const days = countDays(
        request.tanggal_mulai,
        request.tanggal_selesai
      );

      const remaining = Number(employee?.sisa_cuti ?? 0);

      if (days > remaining) {
        throw failure(
          `Sisa cuti karyawan hanya ${remaining} hari.`
        );
      }

      const employeeRecords = await readCollection(
        'karyawan',
        'id_karyawan'
      );

      const employeeRecord = employeeRecords.find(
        (item) => item.id_karyawan === employee.id_karyawan
      );

      if (employeeRecord) {
        saveRecord('karyawan', 'id_karyawan', {
          ...employeeRecord,
          sisa_cuti: remaining - days,
        });
      }
    }

    return saveRecord(
      'leaveRequests',
      'id_pengajuan',
      {
        ...request,
        status: decision,
        decided_by: user.id_pengguna,
        decided_at: new Date().toISOString(),
        rejection_reason:
          decision === 'rejected' ? reason.trim() : null,
      }
    );
  },
};
