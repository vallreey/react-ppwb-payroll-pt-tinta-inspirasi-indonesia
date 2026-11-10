
import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { leaveService } from '../services/leaveService';
import { formatDateLong, formatDateTime, toISODate } from '../utils/format';
import Icon from '../components/Icon';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, TableSkeleton } from '../components/StateViews';
import { cardClass, inputClass, selectClass, textareaClass } from '../components/ui';

const REQUEST_TYPES = [
  'Sakit',
  'Cuti Tahunan',
  'Menikah',
  'Izin Pribadi',
  'Izin Keluarga',
];

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'rejected', label: 'Ditolak' },
];

const STATUS = {
  pending: { label: 'Menunggu', tone: 'amber' },
  approved: { label: 'Disetujui', tone: 'green' },
  rejected: { label: 'Ditolak', tone: 'red' },
};

const TYPE_TONES = {
  Sakit: 'red',
  Menikah: 'fuchsia',
  'Cuti Tahunan': 'sky',
  'Izin Pribadi': 'indigo',
  'Izin Keluarga': 'amber',
};

const INITIAL_VALUES = () => ({
  jenis: 'Sakit',
  tanggal_mulai: toISODate(),
  tanggal_selesai: toISODate(),
  jam_mulai: '08:00',
  jam_selesai: '17:00',
  deskripsi: '',
});

const MAX_FILES = 2;
const MAX_FILE_SIZE = 700 * 1024;
const MAX_TOTAL_SIZE = 1200 * 1024;

const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
];

const countDays = (start, end) => {
  if (!start || !end) return 0;

  return Math.max(
    1,
    Math.round(
      (
        new Date(`${end}T00:00:00`) -
        new Date(`${start}T00:00:00`)
      ) / 86400000
    ) + 1
  );
};

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(
    new Error(`File ${file.name} gagal dibaca.`)
  );

  reader.readAsDataURL(file);
});

const fileSize = (size) => size < 1024 * 1024
  ? `${Math.max(1, Math.round(size / 1024))} KB`
  : `${(size / (1024 * 1024)).toFixed(1)} MB`;

export default function LeaveRequestPage() {
  useDocumentTitle('Pengajuan Izin & Cuti');

  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [values, setValues] = useState(INITIAL_VALUES);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');

  const {
    data,
    loading,
    error,
    reload,
  } = useFetch(
    () => leaveService.listMine(user),
    [user.id_pengguna, user.role],
  );

  const employee = data?.employee ?? user.employee ?? null;
  const requests = data?.rows ?? [];

  const balance = Number(employee?.sisa_cuti ?? 0);

  const duration = countDays(
    values.tanggal_mulai,
    values.tanggal_selesai
  );

  const filteredRequests = useMemo(
    () => requests.filter((request) =>
      filter === 'all' || request.status === filter
    ),
    [requests, filter],
  );

  // =================================
  // INPUT FORM
  // =================================

  const onChange = (event) => {
    const { name, value } = event.target;

    setValues((current) => {
      if (
        name === 'jenis' &&
        value !== 'Sakit' &&
        current.tanggal_mulai < toISODate()
      ) {
        return {
          ...current,
          jenis: value,
          tanggal_mulai: toISODate(),
          tanggal_selesai: toISODate(),
        };
      }

      if (name === 'tanggal_mulai') {
        return {
          ...current,
          tanggal_mulai: value,
          tanggal_selesai:
            current.tanggal_selesai < value
              ? value
              : current.tanggal_selesai,
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  // =================================
  // UPLOAD LAMPIRAN
  // =================================

  const onFilesChange = (event) => {
    const selected = Array.from(event.target.files ?? []);

    event.target.value = '';
    setFileError('');

    if (files.length + selected.length > MAX_FILES) {
      setFileError('Lampiran maksimal 2 file.');
      return;
    }

    const invalid = selected.find(
      (file) => !ALLOWED_TYPES.includes(file.type)
    );

    if (invalid) {
      setFileError(
        `${invalid.name}: format harus PNG, JPG, atau PDF.`
      );
      return;
    }

    const large = selected.find(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (large) {
      setFileError(
        `${large.name}: ukuran maksimal 700 KB per file.`
      );
      return;
    }

    const total = [...files, ...selected].reduce(
      (sum, file) => sum + file.size,
      0
    );

    if (total > MAX_TOTAL_SIZE) {
      setFileError(
        'Total ukuran seluruh lampiran maksimal 1,2 MB.'
      );
      return;
    }

    setFiles((current) => [...current, ...selected]);
  };

  // =================================
  // SUBMIT PENGAJUAN
  // =================================

  const submit = async (event) => {
    event.preventDefault();

    if (!employee) {
      return toast.error(
        'Profil karyawan belum tersedia. Hubungi HRD.'
      );
    }

    if (values.tanggal_selesai < values.tanggal_mulai) {
      return toast.error(
        'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'
      );
    }

    if (
      values.tanggal_mulai === values.tanggal_selesai &&
      values.jam_selesai <= values.jam_mulai
    ) {
      return toast.error(
        'Jam selesai harus lebih besar dari jam mulai.'
      );
    }

    if (
      values.jenis === 'Cuti Tahunan' &&
      duration > balance
    ) {
      return toast.error(
        `Sisa cuti tahunan Anda hanya ${balance} hari.`
      );
    }

    if (values.deskripsi.trim().length < 10) {
      return toast.error(
        'Deskripsi minimal 10 karakter.'
      );
    }

    if (fileError) {
      return toast.error(fileError);
    }

    setBusy(true);

    try {
      const lampiran = await Promise.all(
        files.map(async (file, index) => ({
          label: `Bukti ${index + 1}`,
          file_name: file.name,
          type: file.type,
          url: await readFile(file),
        }))
      );

      await leaveService.create(user, {
        ...values,
        deskripsi: values.deskripsi.trim(),
        lampiran,
      });

      toast.success(
        user.role === 'hrd'
          ? 'Pengajuan berhasil dikirim dan menunggu persetujuan Super Admin.'
          : 'Pengajuan berhasil dikirim dan menunggu persetujuan HRD.'
      );

      setValues(INITIAL_VALUES());
      setFiles([]);
      setFileError('');
      setFilter('all');

      reload();
    } catch (requestError) {
      toast.error(
        requestError.message || 'Pengajuan gagal disimpan.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pengajuan Izin & Cuti"
        subtitle="Ajukan izin atau cuti dan pantau status permohonan Anda"
      />

      {/* INFORMASI KARYAWAN */}

      <div className="mb-5 grid gap-4 sm:grid-cols-2">

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white text-sky-700">
              <Icon name="calendar" />
            </span>

            <div>
              <p className="text-xs text-sky-800">
                Sisa cuti tahunan
              </p>

              <p className="mt-0.5 text-xl font-semibold text-slate-900">
                {balance} hari
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
              <Icon name="people" />
            </span>

            <div className="min-w-0">
              <p className="text-xs text-gray-500">
                Data pengaju
              </p>

              <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                {employee?.nama_lengkap ?? user.nama_tampil}
              </p>

              <p className="text-[11px] text-gray-500">
                {employee?.jabatan || user.role} · {employee?.nik || '-'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* FORM PENGAJUAN */}

      <form onSubmit={submit} className={cardClass}>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Form Pengajuan Izin & Cuti
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Lengkapi data pengajuan. Kolom bertanda * wajib diisi.
            </p>
          </div>

          <Badge tone="sky">Pengajuan Baru</Badge>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">

          {/* Jenis */}

          <div>
            <label htmlFor="leave-jenis" className="mb-1.5 block text-xs font-medium text-gray-700">
              Jenis pengajuan *
            </label>

            <select
              id="leave-jenis"
              name="jenis"
              value={values.jenis}
              onChange={onChange}
              className={selectClass}
              required
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Durasi */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Durasi pengajuan
            </label>

            <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700">
              {duration} hari kalender

              {values.jenis === 'Cuti Tahunan' && (
                <span className="ml-auto text-gray-500">
                  Saldo: {balance} hari
                </span>
              )}
            </div>
          </div>

          {/* Tanggal mulai */}

          <div>
            <label htmlFor="leave-start" className="mb-1.5 block text-xs font-medium text-gray-700">
              Tanggal mulai *
            </label>

            <input
              id="leave-start"
              name="tanggal_mulai"
              type="date"
              value={values.tanggal_mulai}
              min={values.jenis === 'Sakit' ? undefined : toISODate()}
              onChange={onChange}
              className={inputClass}
              required
            />
          </div>

          {/* Tanggal selesai */}

          <div>
            <label htmlFor="leave-end" className="mb-1.5 block text-xs font-medium text-gray-700">
              Tanggal selesai *
            </label>

            <input
              id="leave-end"
              name="tanggal_selesai"
              type="date"
              value={values.tanggal_selesai}
              min={values.tanggal_mulai || toISODate()}
              onChange={onChange}
              className={inputClass}
              required
            />
          </div>

          {/* Jam mulai */}

          <div>
            <label htmlFor="leave-time-start" className="mb-1.5 block text-xs font-medium text-gray-700">
              Jam mulai *
            </label>

            <input
              id="leave-time-start"
              name="jam_mulai"
              type="time"
              value={values.jam_mulai}
              onChange={onChange}
              className={inputClass}
              required
            />
          </div>

          {/* Jam selesai */}

          <div>
            <label htmlFor="leave-time-end" className="mb-1.5 block text-xs font-medium text-gray-700">
              Jam selesai *
            </label>

            <input
              id="leave-time-end"
              name="jam_selesai"
              type="time"
              value={values.jam_selesai}
              onChange={onChange}
              className={inputClass}
              required
            />
          </div>

          {/* Deskripsi */}

          <div className="md:col-span-2">
            <label htmlFor="leave-description" className="mb-1.5 block text-xs font-medium text-gray-700">
              Deskripsi / alasan pengajuan *
            </label>

            <textarea
              id="leave-description"
              name="deskripsi"
              rows={4}
              maxLength={1000}
              value={values.deskripsi}
              onChange={onChange}
              placeholder="Jelaskan alasan pengajuan izin atau cuti secara singkat dan jelas..."
              className={textareaClass}
              required
            />

            <p className="mt-1 text-right text-[11px] text-gray-400">
              {values.deskripsi.length}/1.000 karakter
            </p>
          </div>

          {/* Upload lampiran */}

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Lampiran bukti <span className="font-normal text-gray-400">(opsional)</span>
            </label>

            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    Unggah dokumen pendukung
                  </p>

                  <p className="mt-1 text-[11px] text-gray-500">
                    PNG, JPG, atau PDF. Maksimal 2 file, 700 KB per file.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={files.length >= MAX_FILES}
                >
                  <Icon name="plus" className="size-4" />
                  Pilih file
                </Button>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                  multiple
                  onChange={onFilesChange}
                  className="sr-only"
                  tabIndex={-1}
                />
              </div>

              {fileError && (
                <p role="alert" className="mt-3 text-xs text-red-600">
                  {fileError}
                </p>
              )}

              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}`}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
                    >
                      <Icon
                        name={file.type === 'application/pdf' ? 'pdf' : 'documents'}
                        className="size-4 text-gray-500"
                      />

                      <span className="min-w-0 flex-1 truncate text-xs text-gray-700">
                        {file.name}
                      </span>

                      <span className="text-[10px] text-gray-400">
                        {fileSize(file.size)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setFiles((current) =>
                          current.filter((_, i) => i !== index)
                        )}
                        aria-label={`Hapus ${file.name}`}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                      >
                        <Icon name="close" className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

            </div>
          </div>

        </div>

        {/* TOMBOL FORM */}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValues(INITIAL_VALUES());
              setFiles([]);
              setFileError('');
            }}
            disabled={busy}
          >
            Reset Form
          </Button>

          <Button
            type="submit"
            disabled={busy || !employee}
          >
            {busy ? 'Mengirim...' : 'Kirim Pengajuan'}

            {!busy && (
              <Icon name="arrow" className="size-4" />
            )}
          </Button>

        </div>
      </form>

      {/* RIWAYAT PENGAJUAN */}

      <section className={`${cardClass} mt-6`}>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Riwayat Pengajuan Saya
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Hanya pengajuan milik akun Anda yang ditampilkan.
            </p>
          </div>

          <div
            className="inline-flex flex-wrap rounded-xl bg-sky-50 p-1"
            role="tablist"
            aria-label="Filter riwayat pengajuan"
          >
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3 py-2 text-[11px] transition ${
                  filter === item.id
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-700 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="mt-5 overflow-x-auto rounded-xl border border-gray-200"
          aria-busy={loading}
        >
          {loading && (
            <TableSkeleton
              rows={3}
              cols={6}
              label="Memuat riwayat pengajuan..."
            />
          )}

          {error && (
            <ErrorState
              error={error}
              onRetry={reload}
              title="Riwayat pengajuan gagal dimuat"
            />
          )}

          {!loading && !error && (
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-gray-800">
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Jenis</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 text-center font-medium">Durasi</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Keterangan</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState>
                        Belum ada riwayat pengajuan untuk kategori ini.
                      </EmptyState>
                    </td>
                  </tr>
                )}

                {filteredRequests.map((request) => {
                  const status =
                    STATUS[request.status] ?? STATUS.pending;

                  return (
                    <tr
                      key={request.id_pengajuan}
                      className="align-top hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {request.kode}
                        </span>

                        <span className="mt-1 block text-[10px] text-gray-400">
                          {formatDateTime(request.created_at)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={TYPE_TONES[request.jenis] ?? 'gray'}>
                          {request.jenis}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatDateLong(request.tanggal_mulai)}

                        {request.tanggal_selesai !== request.tanggal_mulai && (
                          <>
                            <br />
                            <span className="text-gray-400">
                              s.d. {formatDateLong(request.tanggal_selesai)}
                            </span>
                          </>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        {countDays(
                          request.tanggal_mulai,
                          request.tanggal_selesai
                        )} hari
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Badge tone={status.tone}>
                          {status.label}
                        </Badge>
                      </td>

                      <td className="max-w-64 px-4 py-3 text-gray-600">
                        {request.rejection_reason ? (
                          <span className="text-red-600">
                            Alasan: {request.rejection_reason}
                          </span>
                        ) : request.status === 'approved' ? (
                          'Pengajuan telah disetujui.'
                        ) : (
                          'Menunggu pemeriksaan HRD.'
                        )}

                        {request.lampiran?.length > 0 && (
                          <span className="mt-1 flex gap-2">
                            {request.lampiran.map((file, index) => (
                              <a
                                key={`${file.file_name}-${index}`}
                                href={file.url}
                                download={file.file_name}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 hover:underline"
                              >
                                Bukti {index + 1}
                              </a>
                            ))}
                          </span>
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
    </>
  );
}
