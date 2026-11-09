import { loadDirectory } from './directoryService';
import { readCollection, saveRecord, nextId } from './mockDb';
import { isAfterClosing, isEarly, isLeftEarly, isWorkingDay, statusForCheckIn } from '../utils/workCalendar';
import { toISODate, toTimeString } from '../utils/format';

const failure = (message) => Object.assign(new Error(message), { friendly: true });

export const visibleEmployees = (user, employees) => {
  const active = employees.filter((e) => e.user?.status_persetujuan === 'approved');
  if (['super_admin', 'hrd', 'direktur'].includes(user.role)) return active;
  const myId = user.employee?.id_karyawan;
  if (user.role === 'supervisor') return active.filter((e) => e.id_karyawan === myId || e.id_atasan === myId);
  return active.filter((e) => e.id_karyawan === myId);
};

export const isApprover = (user) => ['super_admin', 'hrd', 'direktur', 'supervisor'].includes(user.role);

export const canApprove = (user, attendance, employee) => {
  if (attendance.status_persetujuan !== 'pending' || !isApprover(user)) return false;
  if (employee?.id_pengguna === user.id_pengguna) return false;
  if (['super_admin', 'hrd'].includes(user.role)) return true;
  return Boolean(user.employee) && employee?.id_atasan === user.employee.id_karyawan;
};

export const attendanceService = {
  async list(user, settings) {
    const [{ employees, departments }, attendance] = await Promise.all([loadDirectory(), readCollection('attendance', 'id_absensi')]);
    const visible = visibleEmployees(user, employees);
    const byId = new Map(visible.map((e) => [e.id_karyawan, e]));
    const rows = attendance
      .filter((a) => byId.has(a.id_karyawan))
      .map((a) => ({ ...a, employee: byId.get(a.id_karyawan), canApprove: canApprove(user, a, byId.get(a.id_karyawan)) }))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || (b.jam_masuk ?? '').localeCompare(a.jam_masuk ?? ''));
    return { rows, departments, visible, summaryFor: (iso) => summarize(visible, attendance, iso, settings) };
  },

  async today(employeeId) {
    const attendance = await readCollection('attendance', 'id_absensi');
    return attendance.find((a) => a.id_karyawan === employeeId && a.tanggal === toISODate()) ?? null;
  },

  async checkIn({ employee, latitude, longitude, photo, settings }) {
    const attendance = await readCollection('attendance', 'id_absensi');
    if (attendance.some((a) => a.id_karyawan === employee.id_karyawan && a.tanggal === toISODate())) {
      throw failure('Anda sudah check-in hari ini.');
    }
    const time = toTimeString();
    return saveRecord('attendance', 'id_absensi', {
      id_absensi: nextId(attendance, 'id_absensi'), id_karyawan: employee.id_karyawan, tanggal: toISODate(),
      jam_masuk: time, jam_keluar: null, lat_masuk: Number(latitude), long_masuk: Number(longitude),
      status: statusForCheckIn(time, settings), status_persetujuan: 'pending', foto: photo || true,
    });
  },

  async checkOut({ employee, latitude, longitude, photo }) {
    const attendance = await readCollection('attendance', 'id_absensi');
    const record = attendance.find((a) => a.id_karyawan === employee.id_karyawan && a.tanggal === toISODate());
    if (!record) throw failure('Anda belum check-in hari ini.');
    if (record.jam_keluar) throw failure('Anda sudah check-out hari ini.');
    return saveRecord('attendance', 'id_absensi', {
      ...record, jam_keluar: toTimeString(), lat_keluar: Number(latitude), long_keluar: Number(longitude), foto_keluar: photo || true,
    });
  },

  async decide(user, id, decision) {
    const [{ employees }, attendance] = await Promise.all([loadDirectory(), readCollection('attendance', 'id_absensi')]);
    const record = attendance.find((a) => a.id_absensi === Number(id));
    if (!record) throw failure('Data absensi tidak ditemukan.');
    if (!canApprove(user, record, employees.find((e) => e.id_karyawan === record.id_karyawan))) {
      throw failure('Anda tidak berhak memproses absensi ini.');
    }
    return saveRecord('attendance', 'id_absensi', {
      ...record, status_persetujuan: decision, approved_by: user.id_pengguna, approved_at: new Date().toISOString(),
    });
  },
};

const summarize = (visible, attendance, iso, settings) => {
  const working = isWorkingDay(iso, settings);
  const active = visible.filter((e) => e.status === 'aktif' && e.user?.status === 'aktif' && (!e.tanggal_masuk || e.tanggal_masuk <= iso));
  const records = attendance.filter(
    (a) => a.tanggal === iso && a.status_persetujuan !== 'rejected' && a.status !== 'alpha' && active.some((e) => e.id_karyawan === a.id_karyawan),
  );
  const hadir = records.filter((a) => a.status === 'hadir');
  const afterClosing = iso !== toISODate() || isAfterClosing(settings);
  return {
    working_day: working,
    present: {
      on_time: hadir.filter((a) => !isEarly(a.jam_masuk, settings)).length,
      early: hadir.filter((a) => isEarly(a.jam_masuk, settings)).length,
      late: records.filter((a) => a.status === 'terlambat').length,
    },
    absent: {
      leaved: records.filter((a) => a.jam_keluar && isLeftEarly(a.jam_keluar, settings)).length,
      no_clock_in: working ? active.filter((e) => !records.some((a) => a.id_karyawan === e.id_karyawan)).length : 0,
      no_clock_out: working && afterClosing ? records.filter((a) => !a.jam_keluar).length : 0,
    },
  };
};
