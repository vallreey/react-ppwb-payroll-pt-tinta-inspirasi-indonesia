import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { useFetch } from '../hooks/useFetch';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useConfirm } from '../hooks/useConfirm';

import { leaveService } from '../services/leaveService';
import { downloadCsv } from '../utils/csv';

import {
  formatDateLong,
  formatDateTime,
  toISODate,
} from '../utils/format';

import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import RowMenu, {
  RowMenuItem,
} from '../components/RowMenu';

import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '../components/StateViews';

import {
  cardClass,
  filterInputClass,
  thClass,
  textareaClass,
} from '../components/ui';

const PER_PAGE = 5;

const TABS = [
  { id: 'pending', label: 'Terbaru' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
];

const TYPE_TONES = {
  Sakit: 'red',
  Menikah: 'fuchsia',
  'Cuti Tahunan': 'sky',
  'Izin Pribadi': 'indigo',
  'Izin Keluarga': 'amber',
};

const TAB_LABELS = {
  pending: 'pengajuan terbaru',
  approved: 'pengajuan yang disetujui',
  rejected: 'pengajuan yang ditolak',
};

const formatNumericDate = (value) => {
  if (!value) return '-';

  const [year, month, day] = value
    .slice(0, 10)
    .split('-');

  return `${day}/${month}/${year}`;
};

const countDays = (start, end) => {
  if (!start || !end) return 1;

  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);

  return Math.max(
    1,
    Math.round((to - from) / 86400000) + 1
  );
};

function LeaveDetailDialog({
  request,
  onClose,
  onApprove,
  onReject,
}) {
  const dialogRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (request && !dialog.open) {
      dialog.showModal();
    }

    if (!request && dialog.open) {
      dialog.close();
    }
  }, [request]);

  if (!request) {
    return <dialog ref={dialogRef} />;
  }

  const employee = request.employee;
  const description = request.deskripsi ?? '';

  const canProcess =
    request.status === 'pending' &&
    request.canProcess;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-[560px] rounded-2xl p-0 shadow-xl backdrop:bg-gray-900/40"
    >
      <div className="max-h-[88vh] overflow-y-auto">

        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Detail Permintaan Cuti
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <Icon name="x" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">

          {/* Identitas Karyawan */}

          <div className="flex items-center gap-3">
            <Avatar
              name={employee?.nama_lengkap ?? 'Karyawan'}
              size="size-12"
            />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {employee?.nama_lengkap}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Permintaan pada {formatDateTime(request.created_at)}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {request.kode}
              </p>
            </div>
          </div>

          {/* Informasi Pengajuan */}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

            <div>
              <p className="text-xs text-gray-400">Jenis</p>
              <p className="mt-1 text-xs font-semibold">
                {request.jenis}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Tanggal Mulai</p>
              <p className="mt-1 text-xs font-semibold">
                {formatDateLong(request.tanggal_mulai)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Tanggal Selesai</p>
              <p className="mt-1 text-xs font-semibold">
                {formatDateLong(request.tanggal_selesai)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Durasi</p>
              <p className="mt-1 text-xs font-semibold">
                {countDays(
                  request.tanggal_mulai,
                  request.tanggal_selesai
                )} hari
              </p>
            </div>

            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-gray-400">Waktu</p>
              <p className="mt-1 text-xs font-semibold">
                {request.jam_mulai || '08:00'} -{' '}
                {request.jam_selesai || '17:00'}
              </p>
            </div>

          </div>

          {/* Deskripsi */}

          <div>
            <p className="text-xs text-gray-400">
              Deskripsi
            </p>

            <p className="mt-2 whitespace-pre-line text-xs leading-6 text-gray-700">
              {description.length > 180 && !expanded
                ? `${description.slice(0, 180)}...`
                : description}
            </p>

            {description.length > 180 && (
              <button
                type="button"
                onClick={() =>
                  setExpanded((value) => !value)
                }
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                {expanded
                  ? 'Tampilkan lebih sedikit'
                  : 'Lihat selengkapnya'}
              </button>
            )}
          </div>

          {/* Alasan Penolakan */}

          {request.rejection_reason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700">
                Alasan Penolakan
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">
                {request.rejection_reason}
              </p>
            </div>
          )}

          {/* Lampiran */}

          <div>
            <p className="mb-2 text-xs text-gray-400">
              Lampiran
            </p>

            {request.lampiran?.length ? (
              <div className="flex flex-wrap gap-2">
                {request.lampiran.map((file, index) => (
                  <a
                    key={`${file.file_name}-${index}`}
                    href={file.url}
                    download={file.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Icon
                      name={
                        file.type?.includes('pdf')
                          ? 'pdf'
                          : 'documents'
                      }
                    />

                    <span className="max-w-40 truncate">
                      {file.file_name}
                    </span>

                    <Icon name="arrow-up" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Tidak ada lampiran.
              </p>
            )}
          </div>

        </div>

        {/* Tombol Aksi */}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">

          {canProcess ? (
            <>
              <Button
                variant="outline"
                onClick={() => onReject(request)}
              >
                Tolak
              </Button>

              <Button
                onClick={() => onApprove(request)}
              >
                Setujui
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
            >
              Tutup
            </Button>
          )}

        </div>

      </div>
    </dialog>
  );
}

function RejectDialog({
  request,
  onClose,
  onSubmit,
}) {
  const dialogRef = useRef(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;

    if (request && !dialog.open) {
      dialog.showModal();
    }

    if (!request && dialog.open) {
      dialog.close();
    }
  }, [request]);

  const submit = (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }

    onSubmit(request, reason.trim());
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-lg rounded-2xl p-0 shadow-xl backdrop:bg-gray-900/40"
    >
      {request && (
        <form onSubmit={submit} className="p-6">

          <h2 className="text-sm font-semibold text-gray-900">
            Permintaan Cuti
          </h2>

          <h3 className="mt-6 text-sm font-semibold text-gray-900">
            Masukkan alasan penolakan Anda di bawah ini
          </h3>

          <p className="mt-2 text-xs leading-5 text-gray-600">
            {request.employee?.nama_lengkap} akan diberi tahu
            tentang alasan ini. Status permintaan akan diperbarui
            menjadi Ditolak.
          </p>

          <textarea
            autoFocus
            rows={4}
            maxLength={500}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError('');
            }}
            placeholder="Ketik alasan penolakan di sini..."
            className={`${textareaClass} mt-4 resize-y`}
            aria-invalid={Boolean(error)}
          />

          {error && (
            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

            <Button
              variant="outline"
              onClick={onClose}
            >
              Batal
            </Button>

            <Button type="submit">
              Konfirmasi
            </Button>

          </div>

        </form>
      )}
    </dialog>
  );
}

export default function LeavePage() {
  useDocumentTitle('Izin & Cuti');

  const { user } = useAuth();
  const toast = useToast();

  const [confirm, confirmDialog] = useConfirm();

  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebouncedValue(search);

  const [filters, setFilters] = useState({
    date: '',
    code: '',
    type: '',
  });

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const {
    data,
    loading,
    error,
    reload,
  } = useFetch(
    () => leaveService.list(user),
    [user.id_pengguna, user.role]
  );

  const tabRows = useMemo(
    () =>
      (data?.rows ?? []).filter(
        (row) => row.status === activeTab
      ),
    [data, activeTab]
  );

  const rows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return tabRows.filter((row) => {
      const employee = row.employee;

      const searchable = `
        ${employee?.nama_lengkap ?? ''}
        ${employee?.nik ?? ''}
        ${row.kode}
        ${row.jenis}
      `.toLowerCase();

      if (query && !searchable.includes(query)) {
        return false;
      }

      if (
        filters.date &&
        row.tanggal_mulai !== filters.date
      ) {
        return false;
      }

      if (
        filters.code &&
        row.kode !== filters.code
      ) {
        return false;
      }

      if (
        filters.type &&
        row.jenis !== filters.type
      ) {
        return false;
      }

      return true;
    });
  }, [tabRows, debouncedSearch, filters]);

  const pageCount = Math.max(
    1,
    Math.ceil(rows.length / PER_PAGE)
  );

  const currentPage = Math.min(page, pageCount);

  const visibleRows = rows.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const activeFilterCount = Object.values(filters)
    .filter(Boolean).length;

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');

    setFilters({
      date: '',
      code: '',
      type: '',
    });

    setPage(1);
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const approve = async (request) => {
    setSelected(null);

    const ok = await confirm({
      title: 'Konfirmasi Perizinan',

      message: `
        Anda akan menyetujui permintaan ${request.jenis}
        dari ${request.employee?.nama_lengkap}.
        Apakah Anda yakin ingin melanjutkan?
      `,

      confirmLabel: 'Konfirmasi',
      tone: 'primary',
    });

    if (!ok) return;

    try {
      await leaveService.decide(
        user,
        request.id_pengajuan,
        'approved'
      );

      toast.success(
        'Permintaan berhasil disetujui.'
      );

      reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const startReject = (request) => {
    setSelected(null);
    setRejectTarget(request);
  };

  const reject = async (request, reason) => {
    try {
      await leaveService.decide(
        user,
        request.id_pengajuan,
        'rejected',
        reason
      );

      setRejectTarget(null);
      setSelected(null);

      toast.success(
        'Permintaan berhasil ditolak.'
      );

      reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const exportCsv = () => {
    downloadCsv(
      `izin-cuti-${activeTab}-${toISODate()}.csv`,
      [
        [
          'Nama Karyawan',
          'NIK',
          'Departemen',
          'Kode',
          'Jenis',
          'Tanggal Mulai',
          'Tanggal Selesai',
          'Waktu',
          'Status',
          'Alasan Penolakan',
        ],

        ...rows.map((row) => [
          row.employee?.nama_lengkap,
          row.employee?.nik,
          row.employee?.department?.nama_departemen,
          row.kode,
          row.jenis,
          row.tanggal_mulai,
          row.tanggal_selesai,
          `${row.jam_mulai || '08:00'}-${row.jam_selesai || '17:00'}`,
          row.status,
          row.rejection_reason ?? '',
        ]),
      ]
    );

    toast.success('File CSV berhasil dibuat.');
  };

  return (
    <>
      <PageHeader
        title="Izin & Cuti"
        subtitle="Persetujuan izin atau cuti karyawan"
      />

      <section
        className={`${cardClass} min-w-0 print-area`}
        aria-labelledby="leave-heading"
      >

        <h2
          id="leave-heading"
          className="text-sm font-semibold text-gray-900"
        >
          Persetujuan Izin & Cuti
        </h2>

        {/* TAB STATUS */}

        <div
          className="no-print mt-5 inline-flex max-w-full flex-wrap rounded-xl bg-sky-100 p-0.5"
          role="tablist"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => changeTab(tab.id)}
              className={`min-w-24 rounded-lg px-5 py-2 text-xs transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-800 text-white shadow-sm'
                  : 'text-gray-800 hover:bg-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FILTER DAN EXPORT */}

        <form
          onSubmit={(event) => event.preventDefault()}
          className="no-print mt-6 flex flex-wrap items-center gap-2.5"
        >

          <span className="flex h-10 min-w-[82px] items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 text-xs text-gray-500">
            <Icon name="filter" />
            {activeFilterCount}/3
          </span>

          {/* Search */}

          <div className="relative min-w-44 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
              <Icon name="search" />
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className={`${filterInputClass} w-full pl-9`}
            />
          </div>

          {/* Filter Tanggal */}

          <input
            type="date"
            value={filters.date}
            onChange={(event) =>
              updateFilter('date', event.target.value)
            }
            className={`${filterInputClass} w-[154px]`}
          />

          {/* Filter Kode */}

          <select
            value={filters.code}
            onChange={(event) =>
              updateFilter('code', event.target.value)
            }
            className={`${filterInputClass} w-[138px]`}
          >
            <option value="">Code</option>

            {[...new Set(tabRows.map((row) => row.kode))]
              .sort()
              .map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
          </select>

          {/* Filter Jenis */}

          <select
            value={filters.type}
            onChange={(event) =>
              updateFilter('type', event.target.value)
            }
            className={`${filterInputClass} w-[150px]`}
          >
            <option value="">Jenis</option>

            {[...new Set(tabRows.map((row) => row.jenis))]
              .sort()
              .map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
          </select>

          {/* Export Excel */}

          <Button
            variant="success"
            onClick={exportCsv}
            disabled={!rows.length}
            className="!h-10 !rounded-lg !border-0 !bg-emerald-50 !px-4 !text-gray-800"
          >
            <Icon name="excel" />
            Export
          </Button>

          {/* Export PDF */}

          <Button
            variant="danger"
            onClick={() => window.print()}
            disabled={!rows.length}
            className="!h-10 !rounded-lg !border-0 !bg-rose-50 !px-4 !text-gray-800"
          >
            <Icon name="pdf" />
            Export
          </Button>

        </form>

        {/* TABEL PENGAJUAN */}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200">

          {loading && (
            <TableSkeleton
              rows={5}
              cols={7}
              label="Memuat data izin dan cuti..."
            />
          )}

          {error && (
            <ErrorState
              error={error}
              onRetry={reload}
              title="Data izin dan cuti gagal dimuat"
            />
          )}

          {!loading && !error && (
            <table className="w-full min-w-[940px] text-left text-xs">

              <thead>
                <tr className="bg-slate-100 text-gray-900">
                  <th className={thClass}>Employee Name</th>
                  <th className={thClass}>Code</th>
                  <th className={`${thClass} text-center`}>
                    Effective Date
                  </th>
                  <th className={`${thClass} text-center`}>
                    Expired Date
                  </th>
                  <th className={`${thClass} text-center`}>
                    Bukti
                  </th>
                  <th className={`${thClass} text-center`}>
                    Status
                  </th>
                  <th className={`${thClass} text-center`}>
                    Other
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">

                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState>
                        {search || activeFilterCount
                          ? 'Tidak ada pengajuan yang cocok.'
                          : `Belum ada ${TAB_LABELS[activeTab]}.`}

                        {(search || activeFilterCount > 0) && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="ml-1 font-medium text-blue-600 hover:underline"
                          >
                            Reset filter
                          </button>
                        )}
                      </EmptyState>
                    </td>
                  </tr>
                )}

                {visibleRows.map((row) => (
                  <tr
                    key={row.id_pengajuan}
                    className="hover:bg-slate-50/70"
                  >

                    {/* Nama Karyawan */}

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">

                        <Avatar
                          name={row.employee?.nama_lengkap ?? 'Karyawan'}
                          size="size-9"
                        />

                        <div>
                          <span className="block max-w-48 truncate text-gray-900">
                            {row.employee?.nama_lengkap}
                          </span>

                          <span className="mt-0.5 block text-[10px] text-gray-400">
                            {row.employee?.nik ?? '-'}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* Kode */}

                    <td className="whitespace-nowrap px-4 py-3">
                      {row.kode}
                    </td>

                    {/* Tanggal Mulai */}

                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {formatNumericDate(row.tanggal_mulai)}
                    </td>

                    {/* Tanggal Selesai */}

                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {formatNumericDate(row.tanggal_selesai)}
                    </td>

                    {/* Bukti */}

                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">

                        {(row.lampiran ?? []).map((file, index) => (
                          <a
                            key={`${file.file_name}-${index}`}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="whitespace-nowrap text-blue-600 hover:underline"
                          >
                            {file.type?.includes('pdf')
                              ? 'PDF'
                              : 'Img'}{' '}
                            {index + 1}
                          </a>
                        ))}

                        {!row.lampiran?.length && '-'}
                      </div>
                    </td>

                    {/* Jenis Pengajuan */}

                    <td className="px-4 py-3 text-center">
                      <Badge
                        tone={TYPE_TONES[row.jenis] ?? 'gray'}
                      >
                        {row.jenis}
                      </Badge>
                    </td>

                    {/* Action */}

                    <td className="px-4 py-3 text-center">

                      <RowMenu
                        label="Action"
                        ariaLabel={`Aksi pengajuan ${row.kode}`}
                      >

                        <RowMenuItem
                          icon="eye"
                          onClick={() => setSelected(row)}
                        >
                          Lihat Detail...
                        </RowMenuItem>

                        {row.status === 'pending' &&
                          row.canProcess && (
                            <>
                              <RowMenuItem
                                icon="check"
                                tone="success"
                                onClick={() => approve(row)}
                              >
                                Setujui
                              </RowMenuItem>

                              <RowMenuItem
                                icon="x"
                                tone="danger"
                                onClick={() => startReject(row)}
                              >
                                Tolak
                              </RowMenuItem>
                            </>
                          )}

                      </RowMenu>

                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          )}

        </div>

      </section>

      {/* PAGINATION */}

      {!loading && !error && (
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          onChange={setPage}
        />
      )}

      {/* MODAL DETAIL */}

      <LeaveDetailDialog
        key={selected?.id_pengajuan ?? 'closed'}
        request={selected}
        onClose={() => setSelected(null)}
        onApprove={approve}
        onReject={startReject}
      />

      {/* MODAL PENOLAKAN */}

      <RejectDialog
        key={rejectTarget?.id_pengajuan ?? 'closed'}
        request={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSubmit={reject}
      />

      {confirmDialog}

    </>
  );
}