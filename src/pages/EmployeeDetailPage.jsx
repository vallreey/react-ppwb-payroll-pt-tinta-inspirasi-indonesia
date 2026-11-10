import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { employeeService } from '../services/employeeService';
import { GENDER, STATUS_KEPEGAWAIAN, formatDateLong, formatRupiah } from '../utils/format';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { useConfirm } from '../hooks/useConfirm';
import { ErrorState, ListSkeleton } from '../components/StateViews';
import { cardClass } from '../components/ui';

const DetailList = ({ title, items }) => (
  <section className={cardClass} aria-label={title}>
    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    <dl className="mt-4 divide-y divide-gray-100 text-xs">
      {items.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[9rem_1fr] gap-3 py-2.5">
          <dt className="text-gray-500">{label}</dt>
          <dd className="min-w-0 break-words text-gray-900">{value !== null && value !== undefined && value !== '' ? value : '-'}</dd>
        </div>
      ))}
    </dl>
  </section>
);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const { data, loading, error, reload } = useFetch(() => employeeService.get(id), [id]);
  const employee = data?.employee;
  useDocumentTitle(employee?.nama_lengkap ?? 'Detail karyawan');

  const canUpdate = ['super_admin', 'hrd'].includes(user.role);
  const sensitive = ['super_admin', 'hrd', 'direktur'].includes(user.role);

  if (loading) return <ListSkeleton rows={6} />;
  if (error) return <ErrorState error={error} onRetry={reload} title="Detail karyawan gagal dimuat" />;

  const inactive = employee.user?.status === 'nonaktif' || employee.status === 'nonaktif';
  const canToggle = canUpdate && employee.id_pengguna !== user.id_pengguna;

  const toggle = async () => {
    if (!inactive) {
      const ok = await confirm({ title: 'Nonaktifkan karyawan?', message: 'Akun login-nya juga tidak akan bisa dipakai.', confirmLabel: 'Nonaktifkan', tone: 'danger' });
      if (!ok) return;
    }
    try {
      await employeeService.setStatus(employee.id_karyawan, inactive ? 'aktif' : 'nonaktif');
      toast.success(inactive ? 'Karyawan diaktifkan kembali.' : 'Karyawan dinonaktifkan.');
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title={employee.nama_lengkap} subtitle={employee.jabatan || 'Detail karyawan'} />

      <section className={cardClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employee.nama_lengkap} size="size-16" className="!text-base" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{employee.nama_lengkap}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-md px-2.5 py-1 font-medium ${inactive ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>{inactive ? 'Nonaktif' : 'Aktif'}</span>
                <span className="text-gray-500">{STATUS_KEPEGAWAIAN[employee.status_kepegawaian]}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to="/karyawan" variant="outline" className="!h-10 !px-4 !text-xs">Kembali</Button>
            {canUpdate && <Button to={`/karyawan/${employee.id_karyawan}/ubah`} variant="blue" className="!h-10 !px-4 !text-xs"><Icon name="pencil" className="size-4" /> Edit</Button>}
            {canToggle && (
              <Button variant={inactive ? 'success' : 'danger'} onClick={toggle} className="!h-10 !px-4 !text-xs">
                <Icon name={inactive ? 'check' : 'power'} className="size-4" /> {inactive ? 'Aktifkan' : 'Nonaktifkan'}
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DetailList title="Data pribadi" items={[
          ['Employee ID', employee.nik],
          ['Email', employee.user?.email],
          ['Gender', GENDER[employee.jenis_kelamin]],
          ['Tanggal lahir', employee.tanggal_lahir && formatDateLong(employee.tanggal_lahir)],
          ['No. telepon', employee.no_telepon],
          ['Alamat', employee.alamat],
        ]} />
        <DetailList title="Kepegawaian" items={[
          ['Jabatan', employee.jabatan],
          ['Divisi', employee.department?.nama_departemen],
          ['Atasan langsung', employee.supervisor?.nama_lengkap],
          ['Status kepegawaian', STATUS_KEPEGAWAIAN[employee.status_kepegawaian]],
          ['Tanggal masuk', employee.tanggal_masuk && formatDateLong(employee.tanggal_masuk)],
          ['Sisa cuti tahunan', `${employee.sisa_cuti} hari`],
        ]} />
      </div>

      {sensitive && (
        <div className="mt-6">
          <DetailList title="Gaji, rekening, dan dokumen" items={[
            ['Gaji pokok', formatRupiah(employee.gaji_pokok)],
            ['Bank', employee.nama_bank],
            ['No. rekening', employee.no_rekening],
            ['Pemilik rekening', employee.nama_pemilik_rekening],
            ['Scan KTP', employee.dokumen_ktp ? (typeof employee.dokumen_ktp === 'string' ? employee.dokumen_ktp : 'Tersedia') : 'Belum diunggah'],
          ]} />
        </div>
      )}
      {confirmDialog}
    </>
  );
}
