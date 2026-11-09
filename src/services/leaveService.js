import { loadDirectory } from './directoryService';
import { readCollection, saveRecord } from './mockDb';

const APPROVER_ROLES = ['super_admin', 'hrd'];

const failure = (message) =>
  Object.assign(new Error(message), { friendly: true });

export const canManageLeave = (user) =>
  Boolean(user && APPROVER_ROLES.includes(user.role));

export const leaveService = {
  async list(user) {
    if (!canManageLeave(user)) {
      throw failure('Anda tidak memiliki akses.');
    }

    const [{ employees }, requests] = await Promise.all([
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
      .map((request) => {
        const employee = employeeById.get(
          request.id_karyawan
        );

        return {
          ...request,
          employee,
          canProcess:
            request.status === 'pending' &&
            employee.id_pengguna !== user.id_pengguna,
        };
      })
      .sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      );

    return { rows };
  },

  async decide(user, id, decision, reason = '') {
    if (!canManageLeave(user)) {
      throw failure(
        'Hanya HRD dan Super Admin yang dapat memproses pengajuan.'
      );
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
      throw failure('Pengajuan sudah diproses sebelumnya.');
    }

    const { employees } = await loadDirectory();

    const employee = employees.find(
      (item) => item.id_karyawan === request.id_karyawan
    );

    if (employee?.id_pengguna === user.id_pengguna) {
      throw failure(
        'Anda tidak dapat memproses pengajuan milik sendiri.'
      );
    }

    const now = new Date().toISOString();

    return saveRecord('leaveRequests', 'id_pengajuan', {
      ...request,
      status: decision,
      decided_by: user.id_pengguna,
      decided_at: now,
      rejection_reason:
        decision === 'rejected' ? reason.trim() : null,
    });
  },
};