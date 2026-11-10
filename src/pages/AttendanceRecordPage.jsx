import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { attendanceService } from '../services/attendanceService';
import { formatClock, formatDateWithDay, toISODate } from '../utils/format';
import { isWorkingDay } from '../utils/workCalendar';
import Icon from '../components/Icon';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { ErrorState, ListSkeleton } from '../components/StateViews';
import { cardClass } from '../components/ui';

const APPROVAL = { pending: ['Menunggu persetujuan', 'text-amber-600'], approved: ['Disetujui', 'text-green-600'], rejected: ['Ditolak', 'text-red-600'] };

const shrinkImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Berkas bukan gambar yang valid.')); };
    img.src = url;
  });

export default function AttendanceRecordPage() {
  useDocumentTitle('Catat Absensi');
  const { user } = useAuth();
  const { settings } = useSettings();
  const toast = useToast();
  const employee = user.employee;
  const today = toISODate();

  const { data: record, loading, error, reload } = useFetch(
    () => (employee ? attendanceService.today(employee.id_karyawan) : Promise.resolve(null)),
    [employee?.id_karyawan],
  );
  const mode = !record ? 'masuk' : !record.jam_keluar ? 'keluar' : 'selesai';

  return (
    <>
      <PageHeader title="Catat Absensi" subtitle={`${formatDateWithDay(new Date())}, jam masuk ${settings.work_start}`} actions={<Button to="/absensi" variant="outline">Kembali ke Absensi</Button>} />
      <div className="mx-auto max-w-md space-y-4">
        {!employee ? (
          <section className={`${cardClass} text-center`}>
            <p className="text-xs text-gray-700">Akun Anda belum terhubung dengan data karyawan, sehingga absensi tidak dapat dicatat.</p>
            <p className="mt-1 text-xs text-gray-500">Hubungi HRD untuk melengkapi data karyawan Anda.</p>
          </section>
        ) : loading ? <ListSkeleton rows={3} /> : error ? <ErrorState error={error} onRetry={reload} /> : (
          <>
            <section className={cardClass} aria-labelledby="today-heading">
              <h2 id="today-heading" className="text-xs font-semibold text-gray-900">Absensi hari ini</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-500">Check-in</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatClock(record?.jam_masuk)}</dd>
                  {record && <dd className={`mt-1 text-xs ${record.status === 'terlambat' ? 'text-red-600' : 'text-green-600'}`}>{record.status === 'terlambat' ? 'Terlambat' : 'Tepat waktu'}</dd>}
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Check-out</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{formatClock(record?.jam_keluar)}</dd>
                </div>
              </dl>
              {record && (
                <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  Persetujuan atasan: <span className={`font-medium ${APPROVAL[record.status_persetujuan][1]}`}>{APPROVAL[record.status_persetujuan][0]}</span>
                </p>
              )}
              {!isWorkingDay(today, settings) && <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">Hari ini bukan hari kerja.</p>}
            </section>

            {mode === 'selesai' ? (
              <section className={`${cardClass} text-center`}>
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600"><Icon name="check" className="size-6" /></span>
                <p className="mt-3 text-xs font-medium text-gray-900">{record.status_persetujuan === 'rejected' ? 'Absensi hari ini ditolak atasan.' : 'Absensi hari ini sudah lengkap.'}</p>
                <p className="mt-1 text-xs text-gray-500">{record.status_persetujuan === 'rejected' ? 'Hubungi HRD untuk koreksi.' : 'Terima kasih. Sampai jumpa besok.'}</p>
                <Link to="/absensi" className="mt-4 inline-block text-xs font-medium text-blue-600 hover:underline">Lihat riwayat absensi</Link>
              </section>
            ) : (
              <CaptureForm key={mode} mode={mode} employee={employee} settings={settings} onDone={(message) => { toast.success(message); reload(); }} />
            )}
          </>
        )}
      </div>
    </>
  );
}

const geoSupportError = () => {
  if (!window.isSecureContext) return 'Lokasi hanya bisa diambil lewat HTTPS atau localhost.';
  if (!navigator.geolocation) return 'Perangkat ini tidak mendukung GPS.';
  return '';
};

/* Form check-in / check-out: langkah 1 lokasi (GPS), langkah 2 foto, langkah 3 kirim. */
function CaptureForm({ mode, employee, settings, onDone }) {
  const isOut = mode === 'keluar';
  const [loc, setLoc] = useState(() => {
    const unsupported = geoSupportError();
    return unsupported ? { state: 'error', message: unsupported } : { state: 'loading', message: 'Mengambil lokasi…' };
  });
  const [photo, setPhoto] = useState({ preview: null, error: '' });
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef(null);

  const requestPosition = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLoc({ state: 'ok', lat: coords.latitude.toFixed(7), lng: coords.longitude.toFixed(7), message: `Lokasi ditemukan (akurasi ±${Math.round(coords.accuracy)} m).` }),
      (err) => setLoc({
        state: 'error',
        message: err.code === 1
          ? 'Izin lokasi ditolak. Aktifkan GPS dan izinkan lokasi untuk situs ini, lalu tekan Ulangi.'
          : 'Lokasi tidak ditemukan. Aktifkan GPS lalu tekan Ulangi.',
      }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  const retryLocation = () => {
    const unsupported = geoSupportError();
    if (unsupported) {
      setLoc({ state: 'error', message: unsupported });
      return;
    }
    setLoc({ state: 'loading', message: 'Mengambil lokasi…' });
    requestPosition();
  };

  useEffect(() => {
    if (!geoSupportError()) requestPosition();
  }, [requestPosition]);

  const onPhoto = async (e) => {
    const file = e.target.files[0];
    setPhoto({ preview: null, error: '' });
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhoto({ preview: null, error: 'File harus berupa foto.' });
      e.target.value = '';
      return;
    }
    try {
      setPhoto({ preview: await shrinkImage(file), error: '' });
    } catch (err) {
      setPhoto({ preview: null, error: err.message });
    }
  };

  const ready = loc.state === 'ok' && Boolean(photo.preview) && !busy;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setSubmitError('');
    try {
      const payload = { employee, latitude: loc.lat, longitude: loc.lng, photo: photo.preview, settings };
      if (isOut) await attendanceService.checkOut(payload);
      else await attendanceService.checkIn(payload);
      onDone(isOut ? 'Check-out berhasil dicatat.' : 'Check-in berhasil dicatat.');
    } catch (err) {
      setSubmitError(err.message);
      setBusy(false);
    }
  };

  const label = isOut ? 'Check-out sekarang' : 'Check-in sekarang';
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{submitError}</p>}

      <section className={cardClass} aria-labelledby="loc-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="loc-heading" className="flex items-center gap-2 text-xs font-semibold text-gray-900">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white" aria-hidden="true">1</span> Lokasi
          </h2>
          <button type="button" onClick={retryLocation} disabled={loc.state === 'loading'} className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Icon name="refresh" className="size-3.5" /> Ulangi
          </button>
        </div>
        <p role="status" aria-live="polite" className={`mt-3 text-xs ${loc.state === 'ok' ? 'text-green-700' : loc.state === 'error' ? 'text-red-700' : 'text-gray-500'}`}>{loc.message}</p>
        {loc.state === 'error' && (
          <button
            type="button"
            onClick={() => setLoc({ state: 'ok', lat: String(settings.office_lat), lng: String(settings.office_long), message: 'Mode demo: memakai koordinat kantor dari Pengaturan.' })}
            className="mt-3 text-xs font-medium text-blue-600 hover:underline"
          >
            Gunakan koordinat kantor (mode demo)
          </button>
        )}
      </section>

      <section className={cardClass} aria-labelledby="photo-heading">
        <h2 id="photo-heading" className="flex items-center gap-2 text-xs font-semibold text-gray-900">
          <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white" aria-hidden="true">2</span> Foto bukti kehadiran
        </h2>
        {photo.preview && <img src={photo.preview} alt="Foto yang akan dikirim" className="mt-3 aspect-[4/3] w-full rounded-xl object-cover" />}
        <input ref={fileRef} id="foto" name="foto" type="file" accept="image/*" capture="user" onChange={onPhoto} className="peer sr-only" aria-describedby={photo.error ? 'foto-error' : undefined} />
        <label htmlFor="foto" className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-400 bg-blue-50 px-4 py-4 text-xs font-medium text-blue-700 hover:bg-blue-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-500">
          <Icon name="camera" /> {photo.preview ? 'Ambil ulang foto' : 'Ambil foto'}
        </label>
        {photo.error && <p id="foto-error" role="alert" className="mt-2 text-xs text-red-700">{photo.error}</p>}
      </section>

      <Button type="submit" disabled={!ready} className="w-full py-4 text-base">{busy ? 'Mengirim…' : label}</Button>
      <p className="text-center text-xs text-gray-500">Waktu dicatat saat Anda menekan tombol kirim.</p>
    </form>
  );
}
