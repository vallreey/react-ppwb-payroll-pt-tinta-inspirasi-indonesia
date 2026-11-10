import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useListFilters } from '../hooks/useListFilters';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { employeeService } from '../services/employeeService';
import { downloadCsv } from '../utils/csv';
import { GENDER, STATUS_KEPEGAWAIAN, formatDateShort, toISODate } from '../utils/format';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import RowMenu, { RowMenuItem } from '../components/RowMenu';
import { useConfirm } from '../hooks/useConfirm';
import { CardsSkeleton, EmptyState, ErrorState, TableSkeleton } from '../components/StateViews';
import { cardClass, filterInputClass, thClass } from '../components/ui';

const PER_PAGE = 10;
const DEFAULT_FILTERS = { q: '', date: '', division: '', status: '' };
const STATUS_STYLE = {
  tetap: ['bg-indigo-400', 'bg-indigo-100 text-indigo-600'],
  kontrak: ['bg-amber-300', 'bg-amber-100 text-amber-600'],
  percobaan: ['bg-sky-300', 'bg-sky-100 text-sky-500'],
};
const GENDER_STYLE = { L: ['bg-emerald-300', 'bg-emerald-100 text-emerald-600'], P: ['bg-rose-300', 'bg-rose-100 text-rose-500'] };
const STATUS_OPTIONS = { ...STATUS_KEPEGAWAIAN, nonaktif: 'Nonaktif' };

export default function EmployeesPage() {
  useDocumentTitle('Karyawan');
  const { user } = useAuth();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const canManage = ['super_admin', 'hrd'].includes(user.role);
  const { filters, page, setFilter, setPage, reset, activeCount } = useListFilters(DEFAULT_FILTERS);
  const [search, setSearch] = useState(filters.q);
  const debounced = useDebouncedValue(search);
  useEffect(() => { if (debounced !== filters.q) setFilter('q', debounced); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, reload } = useFetch(() => employeeService.list(), []);

  const summary = useMemo(() => {
    const list = data?.employees ?? [];
    const count = (fn) => list.filter(fn).length;
    return {
      total: list.length,
      status: Object.fromEntries(Object.keys(STATUS_KEPEGAWAIAN).map((k) => [k, count((e) => e.status_kepegawaian === k)])),
      gender: { L: count((e) => e.jenis_kelamin === 'L'), P: count((e) => e.jenis_kelamin === 'P') },
      genderMissing: count((e) => !e.jenis_kelamin),
    };
  }, [data]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (data?.employees ?? []).filter((e) => {
      if (q && !`${e.nama_lengkap} ${e.nik}`.toLowerCase().includes(q)) return false;
      if (filters.date && (!e.tanggal_masuk || e.tanggal_masuk > filters.date)) return false;
      if (filters.division && String(e.id_departemen) !== filters.division) return false;
      if (filters.status === 'nonaktif') return e.status_tampil === 'nonaktif';
      if (filters.status) return e.status_tampil !== 'nonaktif' && e.status_kepegawaian === filters.status;
      return true;
    });
  }, [data, filters]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = rows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const filterCount = activeCount(['date', 'division', 'status']);
  const genderKinds = Object.values(summary.gender).filter((n) => n > 0).length;

  const toggleStatus = async (employee) => {
    const deactivate = employee.status_tampil !== 'nonaktif';
    if (deactivate) {
      const ok = await confirm({
        title: 'Nonaktifkan karyawan?',
        message: `Nonaktifkan ${employee.nama_lengkap}? Akun login-nya juga tidak akan bisa dipakai.`,
        confirmLabel: 'Nonaktifkan',
        tone: 'danger',
      });
      if (!ok) return;
    }
    try {
      await employeeService.setStatus(employee.id_karyawan, deactivate ? 'nonaktif' : 'aktif');
      toast.success(deactivate ? 'Karyawan dinonaktifkan.' : 'Karyawan diaktifkan kembali.');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const exportCsv = () => {
    downloadCsv(`karyawan-${toISODate()}.csv`, [
      ['Employee ID', 'Nama', 'Divisi', 'Jabatan', 'Gender', 'Status', 'Tanggal masuk'],
      ...rows.map((e) => [
        e.nik, e.nama_lengkap, e.department?.nama_departemen ?? '-', e.jabatan || '-', GENDER[e.jenis_kelamin] ?? '-',
        e.status_tampil === 'nonaktif' ? 'Nonaktif' : STATUS_KEPEGAWAIAN[e.status_kepegawaian], formatDateShort(e.tanggal_masuk),
      ]),
    ]);
    toast.success('File CSV berhasil dibuat.');
  };

  return (
    <>
      <PageHeader title="Karyawan" subtitle="Gambaran umum karyawan di perusahaan" />

      <section className={cardClass} aria-labelledby="list-heading">
        <div className="flex items-start justify-between gap-3">
          <h2 id="list-heading" className="text-sm font-semibold text-gray-900">List Karyawan</h2>
          {canManage && (
            <Button to="/karyawan/baru" variant="outline" aria-label="Tambah karyawan" className="!size-9 !rounded-lg !border-blue-500 !p-0">
              <Icon name="plus" />
            </Button>
          )}
        </div>
        {loading ? <div className="mt-5"><CardsSkeleton count={2} /></div> : error ? null : (
          <div className="mt-5 grid divide-y divide-gray-200 rounded-lg border border-gray-200 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-gray-900">Status</p>
              <p className="mt-3 text-base text-gray-900"><span className="text-xl font-semibold tabular-nums text-sky-600">{summary.total}</span> People</p>
              <ul className="mt-4 space-y-3 text-xs">
                {Object.entries(STATUS_KEPEGAWAIAN).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-3">
                    <span className={`size-4 shrink-0 rounded ${STATUS_STYLE[key][0]}`} aria-hidden="true" />
                    <span className="w-24 text-xs text-gray-900">{label}</span>
                    <span className="tabular-nums text-gray-800">{summary.status[key]} People</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-medium text-gray-900">Gender</p>
              <p className="mt-3 text-base text-gray-900"><span className="text-xl font-semibold tabular-nums text-sky-600">{genderKinds}</span> Gender</p>
              <ul className="mt-4 space-y-3 text-xs">
                {Object.entries(GENDER).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-3">
                    <span className={`size-4 shrink-0 rounded ${GENDER_STYLE[key][0]}`} aria-hidden="true" />
                    <span className="w-24 text-xs text-gray-900">{label}</span>
                    <span className="tabular-nums text-gray-800">{summary.gender[key]} People</span>
                  </li>
                ))}
                {summary.genderMissing > 0 && (
                  <li className="flex items-center gap-3 text-gray-500">
                    <span className="size-4 shrink-0 rounded bg-gray-200" aria-hidden="true" />
                    <span className="w-24 text-xs">Belum diisi</span>
                    <span className="tabular-nums">{summary.genderMissing} People</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className={`${cardClass} mt-6 min-w-0 print-area`} aria-label="Daftar karyawan">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="no-print flex flex-wrap items-center gap-3">
          <span className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs text-gray-500" title="Jumlah filter aktif">
            <Icon name="filter" className="size-4" /> {filterCount}/3
          </span>
          <div className="relative min-w-40 flex-1">
            <label htmlFor="emp-search" className="sr-only">Cari nama atau Employee ID</label>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500"><Icon name="search" className="size-4" /></span>
            <input id="emp-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} placeholder="Search" className={`${filterInputClass} w-full pl-9`} />
          </div>
          <div>
            <label htmlFor="emp-date" className="sr-only">Bergabung sampai tanggal</label>
            <input id="emp-date" type="date" value={filters.date} title="Bergabung sampai tanggal" onChange={(e) => setFilter('date', e.target.value)} className={filterInputClass} />
          </div>
          <div className="relative">
            <label htmlFor="emp-division" className="sr-only">Divisi</label>
            <select id="emp-division" value={filters.division} onChange={(e) => setFilter('division', e.target.value)} className={`${filterInputClass} w-36 appearance-none pr-9`}>
              <option value="">Divisi</option>
              {data?.departments.map((d) => <option key={d.id_departemen} value={d.id_departemen}>{d.nama_departemen}</option>)}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><Icon name="chevron-down" className="size-4" /></span>
          </div>
          <div className="relative">
            <label htmlFor="emp-status" className="sr-only">Status</label>
            <select id="emp-status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${filterInputClass} w-36 appearance-none pr-9`}>
              <option value="">Status</option>
              {Object.entries(STATUS_OPTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><Icon name="chevron-down" className="size-4" /></span>
          </div>
          <button type="button" onClick={exportCsv} disabled={!rows.length} className="flex h-10 items-center gap-2 rounded-lg bg-emerald-50 px-4 text-xs text-gray-800 shadow-card hover:bg-emerald-100 disabled:opacity-50">
            <Icon name="excel" className="size-4 text-emerald-700" /> Export <span className="sr-only">ke CSV</span>
          </button>
          <button type="button" onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-lg bg-red-50 px-4 text-xs text-gray-800 shadow-card hover:bg-red-100">
            <Icon name="pdf" className="size-4 text-red-600" /> Export <span className="sr-only">ke PDF (cetak)</span>
          </button>
        </form>

        <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100" aria-busy={loading}>
          {loading && <TableSkeleton rows={6} cols={6} label="Memuat data karyawan…" />}
          {error && <ErrorState error={error} onRetry={reload} title="Data karyawan gagal dimuat" />}
          {!loading && !error && (
            <table className="w-full min-w-[820px] text-left text-xs">
              <caption className="sr-only">Daftar karyawan</caption>
              <thead>
                <tr className="bg-slate-100 text-gray-900">
                  <th scope="col" className={thClass}>Employee ID</th>
                  <th scope="col" className={thClass}>Employee Name</th>
                  <th scope="col" className={thClass}>Divisi</th>
                  <th scope="col" className={`${thClass} text-center`}>Gender</th>
                  <th scope="col" className={`${thClass} text-center`}>Status</th>
                  <th scope="col" className={`${thClass} text-center`}>Other</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visibleRows.length === 0 && (
                  <tr><td colSpan={6}>
                    <EmptyState>
                      {filterCount > 0 || filters.q ? 'Tidak ada karyawan yang cocok dengan filter ini. ' : 'Belum ada data karyawan.'}
                      {(filterCount > 0 || filters.q) && <button type="button" onClick={() => { setSearch(''); reset(); }} className="font-medium text-blue-600 hover:underline">Reset filter</button>}
                    </EmptyState>
                  </td></tr>
                )}
                {visibleRows.map((e) => {
                  const inactive = e.status_tampil === 'nonaktif';
                  return (
                    <tr key={e.id_karyawan} className={inactive ? 'bg-gray-50/70 text-gray-500' : ''}>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-800">{e.nik}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="hidden sm:inline-flex"><Avatar name={e.nama_lengkap} /></span>
                          <span className="whitespace-nowrap">
                            <span className="block text-gray-900">{e.nama_lengkap}</span>
                            <span className="block text-[11px] text-gray-500">{e.jabatan || '-'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{e.department?.nama_departemen ?? '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {e.jenis_kelamin ? <span className={`inline-flex rounded-md px-3 py-1 text-xs font-medium ${GENDER_STYLE[e.jenis_kelamin][1]}`}>{GENDER[e.jenis_kelamin]}</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ${inactive ? 'bg-gray-200 text-gray-600' : STATUS_STYLE[e.status_kepegawaian][1]}`}>
                          {inactive ? 'Nonaktif' : STATUS_KEPEGAWAIAN[e.status_kepegawaian]}
                        </span>
                      </td>
                      <td className="no-print px-4 py-3 text-center">
                        <RowMenu ariaLabel={`Aksi untuk ${e.nama_lengkap}`}>
                          <RowMenuItem to={`/karyawan/${e.id_karyawan}`} icon="eye">Lihat detail</RowMenuItem>
                          {canManage && <RowMenuItem to={`/karyawan/${e.id_karyawan}/ubah`} icon="pencil">Edit</RowMenuItem>}
                          {canManage && e.id_pengguna !== user.id_pengguna && (
                            <RowMenuItem icon={inactive ? 'check' : 'power'} tone={inactive ? 'success' : 'danger'} onClick={() => toggleStatus(e)}>
                              {inactive ? 'Aktifkan' : 'Nonaktifkan'}
                            </RowMenuItem>
                          )}
                        </RowMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {!loading && !error && <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />}
      {confirmDialog}
    </>
  );
}
