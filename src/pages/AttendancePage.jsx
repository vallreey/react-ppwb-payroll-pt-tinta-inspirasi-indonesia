import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useListFilters } from '../hooks/useListFilters';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { attendanceService, isApprover } from '../services/attendanceService';
import { downloadCsv } from '../utils/csv';
import { formatClock, formatDateShort, formatDateWithDay, toISODate } from '../utils/format';
import Icon from '../components/Icon';
import evidencePlaceholder from '../assets/bukti-absensi.svg';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import PhotoDialog from '../components/PhotoDialog';
import RowMenu, { RowMenuItem } from '../components/RowMenu';
import { useConfirm } from '../hooks/useConfirm';
import { EmptyState, ErrorState, TableSkeleton } from '../components/StateViews';
import { cardClass, filterInputClass, thClass } from '../components/ui';

const PER_PAGE = 10;
const DEFAULT_FILTERS = { q: '', date: '', division: '', status: '' };
const STATUS_BADGE = { hadir: ['green', 'On-Time'], terlambat: ['red', 'Late'], alpha: ['amber', 'Absent'] };
const APPROVAL_TEXT = { pending: ['Menunggu', 'text-amber-600'], approved: ['Disetujui', 'text-green-600'], rejected: ['Ditolak', 'text-red-600'] };
const STATUS_OPTIONS = { on_time: 'On-Time', late: 'Late', pending: 'Menunggu persetujuan', approved: 'Disetujui', rejected: 'Ditolak' };

export default function AttendancePage() {
  useDocumentTitle('Absensi');
  const { user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const manager = isApprover(user);
  const { filters, page, setFilter, setPage, reset, activeCount } = useListFilters(DEFAULT_FILTERS);
  const [search, setSearch] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(search);
  const [photo, setPhoto] = useState(null);

  useEffect(() => { if (debouncedSearch !== filters.q) setFilter('q', debouncedSearch); }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, reload } = useFetch(() => attendanceService.list(user, settings), [user.id_pengguna, settings]);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = filters.q.trim().toLowerCase();
    return data.rows.filter((a) => {
      if (q && !`${a.employee.nama_lengkap} ${a.employee.nik}`.toLowerCase().includes(q)) return false;
      if (filters.date && a.tanggal !== filters.date) return false;
      if (filters.division && String(a.employee.id_departemen) !== filters.division) return false;
      switch (filters.status) {
        case 'on_time': return a.status === 'hadir';
        case 'late': return a.status === 'terlambat';
        case 'pending': case 'approved': case 'rejected': return a.status_persetujuan === filters.status;
        default: return true;
      }
    });
  }, [data, filters]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = rows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const summaryDate = filters.date || toISODate();
  const summary = manager && data ? data.summaryFor(summaryDate) : null;
  const filterCount = activeCount(manager ? ['date', 'division', 'status'] : ['date', 'status']);

  const decide = async (attendance, decision) => {
    const approve = decision === 'approved';
    const ok = await confirm({
      title: approve ? 'Setujui absensi?' : 'Tolak absensi?',
      message: `${approve ? 'Setujui' : 'Tolak'} absensi ${attendance.employee.nama_lengkap} pada ${formatDateShort(attendance.tanggal)}?`,
      confirmLabel: approve ? 'Setujui' : 'Tolak',
      tone: approve ? 'primary' : 'danger',
    });
    if (!ok) return;
    try {
      await attendanceService.decide(user, attendance.id_absensi, decision);
      toast.success(approve ? 'Absensi disetujui.' : 'Absensi ditolak.');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const exportCsv = () => {
    downloadCsv(`absensi-${toISODate()}.csv`, [
      ['Nama', 'NIK', 'Divisi', 'Tanggal', 'Check-in', 'Check-out', 'Status', 'Persetujuan'],
      ...rows.map((a) => [
        a.employee.nama_lengkap, a.employee.nik, a.employee.department?.nama_departemen ?? '-', a.tanggal,
        formatClock(a.jam_masuk), formatClock(a.jam_keluar), STATUS_BADGE[a.status]?.[1] ?? a.status, APPROVAL_TEXT[a.status_persetujuan][0],
      ]),
    ]);
    toast.success('File CSV berhasil dibuat.');
  };

  return (
    <>
      <PageHeader
        title="Absensi"
        subtitle={manager ? 'Rekap kehadiran karyawan' : 'Riwayat kehadiran saya'}
        actions={(
          <Button to="/absensi/catat"><Icon name="camera" className="size-4" /> Catat Absensi</Button>
        )}
      />

      {manager && (
        <section className={`${cardClass} mb-6`} aria-labelledby="presence-heading">
          <h2 id="presence-heading" className="text-sm font-semibold text-gray-900">Kehadiran</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatDateWithDay(summaryDate)}
            {summary && !summary.working_day && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">Bukan hari kerja</span>}
          </p>
          {loading && <div className="mt-5"><TableSkeleton rows={1} cols={6} /></div>}
          {summary && (
            <div className="mt-5 grid divide-y divide-gray-200 rounded-lg border border-gray-200 md:grid-cols-2 md:divide-x md:divide-y-0">
              {[
                ['Present', [['On Time', summary.present.on_time], ['Early Clock In', summary.present.early], ['Late Clock In', summary.present.late]]],
                ['Absent', [['Leaved', summary.absent.leaved], ['No Clock In', summary.absent.no_clock_in], ['No Clock Out', summary.absent.no_clock_out]]],
              ].map(([group, items]) => (
                <div key={group} className="p-4 sm:p-5">
                  <p className="text-xs font-medium text-gray-900">{group}</p>
                  <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
                    {items.map(([label, count]) => (
                      <div key={label}>
                        <dd className="text-xl font-semibold tabular-nums text-blue-700">{count}</dd>
                        <dt className="mt-1 text-xs text-gray-500">{label}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className={`${cardClass} min-w-0 print-area`} aria-labelledby="approval-heading">
        <h2 id="approval-heading" className="text-sm font-semibold text-gray-900">{manager ? 'Persetujuan Absensi' : 'Riwayat Absensi'}</h2>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="no-print mt-5 flex flex-wrap items-center gap-3">
          <span className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs text-gray-500" title="Jumlah filter aktif">
            <Icon name="filter" className="size-4" /> {filterCount}/{manager ? 3 : 2}
          </span>
          <div className="relative min-w-40 flex-1">
            <label htmlFor="att-search" className="sr-only">Cari nama atau NIK</label>
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500"><Icon name="search" className="size-4" /></span>
            <input id="att-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} placeholder="Search" className={`${filterInputClass} w-full pl-9`} />
          </div>
          <div>
            <label htmlFor="att-date" className="sr-only">Tanggal</label>
            <input id="att-date" type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} className={filterInputClass} />
          </div>
          {manager && (
            <div className="relative">
              <label htmlFor="att-division" className="sr-only">Divisi</label>
              <select id="att-division" value={filters.division} onChange={(e) => setFilter('division', e.target.value)} className={`${filterInputClass} w-36 appearance-none pr-9`}>
                <option value="">Divisi</option>
                {data?.departments.map((d) => <option key={d.id_departemen} value={d.id_departemen}>{d.nama_departemen}</option>)}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><Icon name="chevron-down" className="size-4" /></span>
            </div>
          )}
          <div className="relative">
            <label htmlFor="att-status" className="sr-only">Status</label>
            <select id="att-status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${filterInputClass} w-44 appearance-none pr-9`}>
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
          {loading && <TableSkeleton rows={6} cols={6} label="Memuat data absensi…" />}
          {error && <ErrorState error={error} onRetry={reload} title="Data absensi gagal dimuat" />}
          {!loading && !error && (
            <table className="w-full min-w-[860px] text-left text-xs">
              <caption className="sr-only">Daftar absensi karyawan</caption>
              <thead>
                <tr className="bg-slate-100 text-gray-900">
                  <th scope="col" className={thClass}>Employee Name</th>
                  <th scope="col" className={thClass}>Divisi</th>
                  <th scope="col" className={`${thClass} text-center`}>Check-in</th>
                  <th scope="col" className={`${thClass} text-center`}>Check-out</th>
                  <th scope="col" className={`${thClass} text-center`}>Evidence</th>
                  <th scope="col" className={`${thClass} text-center`}>Status</th>
                  <th scope="col" className={`${thClass} text-center`}>Other</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visibleRows.length === 0 && (
                  <tr><td colSpan={7}>
                    <EmptyState>
                      {filterCount > 0 || filters.q ? 'Tidak ada data absensi yang cocok dengan filter ini. ' : 'Belum ada data absensi.'}
                      {(filterCount > 0 || filters.q) && <button type="button" onClick={() => { setSearch(''); reset(); }} className="font-medium text-blue-600 hover:underline">Reset filter</button>}
                    </EmptyState>
                  </td></tr>
                )}
                {visibleRows.map((a) => {
                  const [tone, label] = STATUS_BADGE[a.status] ?? STATUS_BADGE.hadir;
                  const [approvalLabel, approvalClass] = APPROVAL_TEXT[a.status_persetujuan];
                  const name = a.employee.nama_lengkap;
                  const photoSrc = (value) => (typeof value === 'string' && value.startsWith('data:') ? value : evidencePlaceholder);
                  return (
                    <tr key={a.id_absensi}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="hidden sm:inline-flex"><Avatar name={name} /></span>
                          <span className="whitespace-nowrap">
                            <span className="block text-gray-900">{name}</span>
                            {!filters.date && <span className="block text-[11px] text-gray-500">{formatDateShort(a.tanggal)}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">{a.employee.department?.nama_departemen ?? '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums">{formatClock(a.jam_masuk)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums">{formatClock(a.jam_keluar)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-xs">
                        <span className="inline-flex items-center gap-3">
                          <button type="button" onClick={() => setPhoto({ src: photoSrc(a.foto), title: `Check-in ${name}` })} className="text-blue-600 hover:underline">Img 1</button>
                          {a.foto_keluar && <button type="button" onClick={() => setPhoto({ src: photoSrc(a.foto_keluar), title: `Check-out ${name}` })} className="text-blue-600 hover:underline">Img 2</button>}
                          <a href={`https://www.google.com/maps?q=${a.lat_masuk},${a.long_masuk}`} target="_blank" rel="noopener noreferrer" aria-label={`Lihat lokasi check-in ${name} di peta`} className="text-gray-500 hover:text-blue-600">
                            <Icon name="pin" className="size-4" />
                          </a>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center"><Badge tone={tone}>{label}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        {a.canApprove ? (
                          <RowMenu label="Action" ariaLabel={`Aksi untuk absensi ${name}`}>
                            <RowMenuItem icon="check" tone="success" onClick={() => decide(a, 'approved')}>Setujui</RowMenuItem>
                            <RowMenuItem icon="x" tone="danger" onClick={() => decide(a, 'rejected')}>Tolak</RowMenuItem>
                          </RowMenu>
                        ) : (
                          <span className={`text-xs font-medium ${approvalClass}`}>{approvalLabel}</span>
                        )}
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
      <PhotoDialog photo={photo?.src} title={photo?.title} onClose={() => setPhoto(null)} />
      {confirmDialog}
    </>
  );
}
