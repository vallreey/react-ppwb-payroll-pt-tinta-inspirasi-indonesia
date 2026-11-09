import { readCollection } from './mockDb';

export const loadDirectory = async () => {
  const [departments, users, employees] = await Promise.all([
    readCollection('departments', 'id_departemen'),
    readCollection('users', 'id_pengguna'),
    readCollection('karyawan', 'id_karyawan'),
  ]);
  const deptById = new Map(departments.map((d) => [d.id_departemen, d]));
  const userById = new Map(users.map((u) => [u.id_pengguna, u]));
  const empById = new Map(employees.map((e) => [e.id_karyawan, e]));
  const empByUser = new Map(employees.map((e) => [e.id_pengguna, e]));

  const joinedEmployees = employees.map((e) => ({
    ...e,
    department: deptById.get(e.id_departemen) ?? null,
    user: userById.get(e.id_pengguna) ?? null,
    supervisor: empById.get(e.id_atasan) ?? null,
  }));
  const joinedUsers = users.map((u) => {
    const employee = empByUser.get(u.id_pengguna) ?? null;
    return {
      ...u,
      employee,
      department: employee ? deptById.get(employee.id_departemen) ?? null : null,
      nama_tampil: employee?.nama_lengkap ?? u.username,
      display_status: u.status_persetujuan === 'pending' ? 'menunggu' : u.status_persetujuan === 'rejected' ? 'ditolak' : u.status,
    };
  });
  return { departments, users: joinedUsers, employees: joinedEmployees };
};
