import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useListFilters } from '../hooks/useListFilters';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { userService } from '../services/userService';
import { ROLE_LABELS, formatDateTime } from '../utils/format';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import RowMenu, { RowMenuItem } from '../components/RowMenu';
import { useConfirm } from '../hooks/useConfirm';
import { CardsSkeleton, EmptyState, ErrorState, TableSkeleton } from '../components/StateViews';
import { filterInputClass, thClass } from '../components/ui';

const PER_PAGE = 10;
const DEFAULTS = { q: '', role: '', status: '', from: '', to: '' };
const ROLE_TONE = { super_admin: 'indigo', hrd: 'fuchsia', supervisor: 'cyan', direktur: 'teal', karyawan: 'orange' };
const STATUS = { aktif: ['green', 'Aktif'], nonaktif: ['gray', 'Nonaktif'], menunggu: ['amber', 'Menunggu'], ditolak: ['red', 'Ditolak'] };
const TABS = [['', 'Semua Pengguna'], ['super_admin', 'Super Admin'], ['karyawan', 'Karyawan'], ['hrd', 'HRD'], ['lainnya', 'Lainnya']];

export default function UsersPage() {
  useDocumentTitle('Manajemen Pengguna');
  const { user: me } = useAuth();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const { filters, page, setFilter, setPage, reset, activeCount } = useListFilters(DEFAULTS);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebouncedValue(search);
  useEffect(() => { if (debounced !== filters.q) setFilter('q', debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data, loading, error, reload } = useFetch(() => userService.list(), []);

  const users = useMemo(() => data?.users ?? [], [data]);
  const stats = useMemo(() => {
    const total = users.length || 1;
    const aktif = users.filter((u) => u.display_status === 'aktif').length;
    const nonaktif = users.filter((u) => u.display_status === 'nonaktif').length;
    return {
      total: users.length, aktif, nonaktif,
      menunggu: users.filter((u) => u.display_status === 'menunggu').length,
      ditolak: users.filter((u) => u.display_status === 'ditolak').length,
      aktifPct: Math.round((aktif / total) * 100), nonaktifPct: Math.round((nonaktif / total) * 100),
    };
  }, [users]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !`${u.nama_tampil} ${u.email}`.toLowerCase().includes(q)) return false;
      if (filters.role === 'lainnya' ? !['supervisor', 'direktur'].includes(u.role) : filters.role && u.role !== filters.role) return false;
      if (filters.status && u.display_status !== filters.status) return false;
      const created = u.created_at.slice(0, 10);
      return !(filters.from && created < filters.from) && !(filters.to && created > filters.to);
    });
  }, [users, filters]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const run = async (action, message) => {
    try { await action(); toast.success(message); reload(); } catch (e) { toast.error(e.message); }
  };
  const toggle = async (u) => {
    const off = u.status === 'aktif';
    if (off && !(await confirm({ title: 'Nonaktifkan akun?', message: `Akun ${u.nama_tampil} tidak akan bisa login.`, confirmLabel: 'Nonaktifkan', tone: 'danger' }))) return;
    run(() => userService.setStatus(u.id_pengguna, off ? 'nonaktif' : 'aktif'), off ? 'Akun dinonaktifkan.' : 'Akun diaktifkan.');
  };

  const cards = [
    ['Total Pengguna', stats.total, 'Semua akun terdaftar', 'employees', 'bg-indigo-100 text-indigo-600'],
    ['Pengguna Aktif', stats.aktif, `${stats.aktifPct}% dari total pengguna`, 'users', 'bg-green-100 text-green-600'],
    ['Pengguna Nonaktif', stats.nonaktif, `${stats.nonaktifPct}% dari total pengguna`, 'power', 'bg-amber-100 text-amber-500'],
    ['Menunggu Persetujuan', stats.menunggu, stats.ditolak ? `${stats.ditolak} registrasi ditolak` : 'Perlu ditinjau Super Admin', 'attendance', 'bg-red-100 text-red-500'],
  ];

  return (
    <>
      <PageHeader title="Manajemen Pengguna" subtitle="Kelola akun pengguna yang terdaftar" actions={(
        <>
          <Button to="/persetujuan-akun" variant="outline">Persetujuan Akun{stats.menunggu ? ` (${stats.menunggu})` : ''}</Button>
          <Button to="/pengguna/baru"><Icon name="plus" className="size-4" /> Buat Akun</Button>
        </>
      )} />

      {loading ? <CardsSkeleton /> : error ? null : (
        <section aria-label="Ringkasan akun" className="stat-grid">
          {cards.map(([label, value, caption, icon, tone]) => (
            <div key={label} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-card">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon name={icon} className="size-6" /></span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900">{label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{value}</p>
                <p className="mt-2 text-xs text-gray-500">{caption}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mt-6 min-w-0 rounded-2xl bg-white shadow-card" aria-labelledby="users-heading">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <h2 id="users-heading" className="text-sm font-semibold text-gray-900">Data Pengguna</h2>
          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-40">
              <label htmlFor="user-search" className="sr-only">Cari nama atau email</label>
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500"><Icon name="search" className="size-4" /></span>
              <input id="user-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} placeholder="Search" className={`${filterInputClass} w-full pl-9`} />
            </div>
            <div className="relative">
              <label htmlFor="user-status" className="sr-only">Status</label>
              <select id="user-status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${filterInputClass} w-36 appearance-none pr-9`}>
                <option value="">Semua Status</option>
                {Object.entries(STATUS).map(([v, [, l]]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><Icon name="chevron-down" className="size-4" /></span>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">Dari
              <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className={filterInputClass} />
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">Sampai
              <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className={filterInputClass} />
            </label>
            <span className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs text-gray-500" title="Jumlah filter aktif">
              <Icon name="filter" className="size-4" /> {activeCount(['role', 'status', 'from', 'to'])}/4
            </span>
          </form>
        </div>

        <nav aria-label="Filter peran" className="overflow-x-auto border-b border-gray-200 px-5 sm:px-6">
          <ul className="flex min-w-max gap-6">
            {TABS.map(([role, label]) => {
              const on = filters.role === role;
              return (
                <li key={label}>
                  <button type="button" onClick={() => setFilter('role', role)} aria-current={on ? 'page' : undefined}
                    className={`-mb-px block border-b-4 px-1 pb-3 text-xs ${on ? 'border-blue-500 font-medium text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{label}</button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-5 sm:p-6">
          <div className="overflow-x-auto rounded-xl border border-gray-100" aria-busy={loading}>
            {loading && <TableSkeleton rows={6} cols={6} label="Memuat data pengguna…" />}
            {error && <ErrorState error={error} onRetry={reload} title="Data pengguna gagal dimuat" />}
            {!loading && !error && (
              <table className="w-full min-w-[820px] text-left text-xs">
                <caption className="sr-only">Daftar akun pengguna</caption>
                <thead>
                  <tr className="bg-slate-100 text-gray-900">
                    {['Employee Name', 'Email', 'Role', 'Divisi', 'Status', 'Terakhir Aktif'].map((h) => <th key={h} scope="col" className={thClass}>{h}</th>)}
                    <th scope="col" className={`${thClass} text-center`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visible.length === 0 && (
                    <tr><td colSpan={7}><EmptyState>Tidak ada pengguna yang cocok. <button type="button" onClick={() => { setSearch(''); reset(); }} className="font-medium text-blue-600 hover:underline">Reset filter</button></EmptyState></td></tr>
                  )}
                  {visible.map((u) => (
                    <tr key={u.id_pengguna}>
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="hidden sm:inline-flex"><Avatar name={u.nama_tampil} /></span><span className="whitespace-nowrap text-gray-900">{u.nama_tampil}</span></div></td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{u.email}</td>
                      <td className="px-4 py-3"><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{u.department?.nama_departemen ?? '-'}</td>
                      <td className="px-4 py-3"><Badge tone={STATUS[u.display_status][0]}>{STATUS[u.display_status][1]}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">{u.terakhir_aktif ? formatDateTime(u.terakhir_aktif) : 'Belum pernah'}</td>
                      <td className="px-4 py-3 text-center">
                        <RowMenu label="Action" ariaLabel={`Aksi untuk ${u.nama_tampil}`}>
                          <RowMenuItem to={`/pengguna/${u.id_pengguna}/ubah`} icon="pencil">Edit</RowMenuItem>
                          {u.display_status === 'menunggu' && <RowMenuItem icon="check" tone="success" onClick={() => run(() => userService.approve(u.id_pengguna, me), 'Akun disetujui.')}>Setujui</RowMenuItem>}
                          {u.display_status === 'menunggu' && <RowMenuItem icon="x" tone="danger" onClick={() => run(() => userService.reject(u.id_pengguna, me), 'Akun ditolak.')}>Tolak</RowMenuItem>}
                          {u.status_persetujuan === 'approved' && u.id_pengguna !== me.id_pengguna && (
                            <RowMenuItem icon={u.status === 'aktif' ? 'power' : 'check'} tone={u.status === 'aktif' ? 'danger' : 'success'} onClick={() => toggle(u)}>{u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</RowMenuItem>
                          )}
                        </RowMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
      {!loading && !error && <Pagination page={current} pageCount={pageCount} onChange={setPage} />}
      {confirmDialog}
    </>
  );
}
