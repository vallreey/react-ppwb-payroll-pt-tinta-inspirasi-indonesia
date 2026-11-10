import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { employeeService } from '../services/employeeService';
import { STATUS_KEPEGAWAIAN, GENDER } from '../utils/format';
import { email as emailRule, maxLength, nik as nikRule, nonNegativeNumber, password as passwordRule, phone as phoneRule, required, validate } from '../utils/validators';
import Field from '../components/Field';
import Icon from '../components/Icon';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { ErrorState, ListSkeleton } from '../components/StateViews';
import { cardClass, inputClass, selectClass, textareaClass } from '../components/ui';

const EMPTY = {
  email: '', password: '', role: 'karyawan', nama_lengkap: '', nik: '', jenis_kelamin: '', tanggal_lahir: '', no_telepon: '', alamat: '',
  jabatan: '', id_departemen: '', id_atasan: '', status_kepegawaian: 'tetap', tanggal_masuk: '', sisa_cuti: 12,
  gaji_pokok: 0, nama_bank: '', no_rekening: '', nama_pemilik_rekening: '', dokumen_ktp: '',
};

const baseRules = {
  nama_lengkap: [required('Nama lengkap'), maxLength('Nama lengkap', 150)],
  nik: [required('Employee ID (NIK)'), nikRule],
  no_telepon: [phoneRule],
  alamat: [maxLength('Alamat', 1000)],
  jabatan: [maxLength('Jabatan', 100)],
  sisa_cuti: [nonNegativeNumber('Sisa cuti')],
  gaji_pokok: [nonNegativeNumber('Gaji pokok')],
  no_rekening: [(v) => (v && !/^\d{5,30}$/.test(v) ? 'No. rekening hanya angka (5–30 digit).' : '')],
  dokumen_ktp: [],
};
const createRules = { ...baseRules, email: [required('Email'), emailRule], password: [required('Kata sandi awal'), passwordRule] };

const Select = ({ children, ...props }) => (
  <div className="relative">
    <select {...props} className={selectClass}>{children}</select>
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><Icon name="chevron-down" className="size-4" /></span>
  </div>
);

export default function EmployeeFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  useDocumentTitle(editing ? 'Ubah Karyawan' : 'Tambah Karyawan');

  const { data, loading, error, reload } = useFetch(
    async () => (editing ? employeeService.get(id) : { ...(await employeeService.formOptions()), employee: null }),
    [id],
  );

  if (loading) return <ListSkeleton rows={6} />;
  if (error) return <ErrorState error={error} onRetry={reload} title="Formulir gagal dimuat" />;
  return <EmployeeForm editing={editing} employee={data.employee} departments={data.departments} supervisors={data.supervisors} />;
}

function EmployeeForm({ editing, employee, departments, supervisors }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState(() => (employee ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, employee[k] ?? EMPTY[k]])), dokumen_ktp: '' } : EMPTY));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const canChooseRole = user.role === 'super_admin';

  const onChange = (e) => {
    const { name, value, files, type } = e.target;
    setValues((v) => ({ ...v, [name]: type === 'file' ? files[0]?.name ?? '' : value }));
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (file && (file.size > 4 * 1024 * 1024 || !/\.(jpe?g|png|pdf)$/i.test(file.name))) {
      setErrors((er) => ({ ...er, dokumen_ktp: 'Scan KTP harus JPG, PNG, atau PDF dan maksimal 4 MB.' }));
      e.target.value = '';
      return;
    }
    setErrors((er) => ({ ...er, dokumen_ktp: undefined }));
    onChange(e);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, editing ? baseRules : createRules);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`field-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      if (editing) await employeeService.update(employee.id_karyawan, values);
      else await employeeService.create(values);
      toast.success(editing ? 'Data karyawan diperbarui.' : 'Karyawan berhasil ditambahkan.');
      navigate(editing ? `/karyawan/${employee.id_karyawan}` : '/karyawan');
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      else toast.error(err.message);
      setBusy(false);
    }
  };

  const err = (name) => errors[name];
  return (
    <>
      <PageHeader title={editing ? 'Ubah Karyawan' : 'Tambah Karyawan'} subtitle={editing ? employee.nama_lengkap : 'Data karyawan baru beserta akun login'} />

      {Object.values(errors).some(Boolean) && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          Ada isian yang perlu diperbaiki. Periksa kolom yang diberi tanda merah.
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {!editing && (
          <fieldset className={cardClass}>
            <legend className="sr-only">Akun login</legend>
            <h2 className="text-sm font-semibold text-gray-900">Akun login</h2>
            <p className="mt-1 text-xs text-gray-500">Akun langsung aktif dan disetujui. Berikan kata sandi awal kepada karyawan.</p>
            <div className="form-grid mt-5">
              <Field name="email" label="Email" error={err('email')} required>
                {(a) => <input {...a} type="email" value={values.email} onChange={onChange} maxLength={150} autoComplete="off" className={inputClass} />}
              </Field>
              <Field name="password" label="Kata sandi awal" error={err('password')} hint="Minimal 8 karakter, mengandung huruf dan angka." required>
                {(a) => <input {...a} type="password" value={values.password} onChange={onChange} maxLength={72} autoComplete="new-password" className={inputClass} />}
              </Field>
              {canChooseRole && (
                <Field name="role" label="Peran akun">
                  {(a) => (
                    <Select {...a} value={values.role} onChange={onChange}>
                      {[['karyawan', 'Karyawan'], ['supervisor', 'Supervisor'], ['hrd', 'HRD'], ['direktur', 'CEO/Direktur']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Select>
                  )}
                </Field>
              )}
            </div>
          </fieldset>
        )}

        <fieldset className={cardClass}>
          <legend className="sr-only">Data pribadi</legend>
          <h2 className="text-sm font-semibold text-gray-900">Data pribadi</h2>
          <div className="form-grid mt-5">
            <Field name="nama_lengkap" label="Nama lengkap" error={err('nama_lengkap')} required>
              {(a) => <input {...a} type="text" value={values.nama_lengkap} onChange={onChange} maxLength={150} className={inputClass} />}
            </Field>
            <Field name="nik" label="Employee ID (NIK)" error={err('nik')} hint="Unik; huruf, angka, titik, strip." required>
              {(a) => <input {...a} type="text" value={values.nik} onChange={onChange} maxLength={20} className={inputClass} />}
            </Field>
            <Field name="jenis_kelamin" label="Gender">
              {(a) => (
                <Select {...a} value={values.jenis_kelamin} onChange={onChange}>
                  <option value="">Belum diisi</option>
                  {Object.entries(GENDER).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              )}
            </Field>
            <Field name="tanggal_lahir" label="Tanggal lahir">
              {(a) => <input {...a} type="date" value={values.tanggal_lahir ?? ''} onChange={onChange} className={inputClass} />}
            </Field>
            <Field name="no_telepon" label="No. telepon" error={err('no_telepon')}>
              {(a) => <input {...a} type="tel" value={values.no_telepon} onChange={onChange} maxLength={20} className={inputClass} />}
            </Field>
            <Field name="alamat" label="Alamat" error={err('alamat')} className="md:col-span-2">
              {(a) => <textarea {...a} rows={3} value={values.alamat} onChange={onChange} maxLength={1000} className={textareaClass} />}
            </Field>
          </div>
        </fieldset>

        <fieldset className={cardClass}>
          <legend className="sr-only">Kepegawaian</legend>
          <h2 className="text-sm font-semibold text-gray-900">Kepegawaian</h2>
          <div className="form-grid mt-5">
            <Field name="jabatan" label="Jabatan" error={err('jabatan')}>
              {(a) => <input {...a} type="text" value={values.jabatan} onChange={onChange} maxLength={100} className={inputClass} />}
            </Field>
            <Field name="id_departemen" label="Divisi">
              {(a) => (
                <Select {...a} value={values.id_departemen ?? ''} onChange={onChange}>
                  <option value="">Belum diisi</option>
                  {departments.map((d) => <option key={d.id_departemen} value={d.id_departemen}>{d.nama_departemen}</option>)}
                </Select>
              )}
            </Field>
            <Field name="id_atasan" label="Atasan langsung" hint="Penerima notifikasi dan penyetuju absensi karyawan ini.">
              {(a) => (
                <Select {...a} value={values.id_atasan ?? ''} onChange={onChange}>
                  <option value="">Tanpa atasan (ditangani HRD)</option>
                  {supervisors.map((s) => <option key={s.id_karyawan} value={s.id_karyawan}>{s.nama_lengkap}{s.jabatan ? ` (${s.jabatan})` : ''}</option>)}
                </Select>
              )}
            </Field>
            <Field name="status_kepegawaian" label="Status kepegawaian" required>
              {(a) => (
                <Select {...a} value={values.status_kepegawaian} onChange={onChange}>
                  {Object.entries(STATUS_KEPEGAWAIAN).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              )}
            </Field>
            <Field name="tanggal_masuk" label="Tanggal masuk">
              {(a) => <input {...a} type="date" value={values.tanggal_masuk ?? ''} onChange={onChange} className={inputClass} />}
            </Field>
            <Field name="sisa_cuti" label="Sisa cuti tahunan (hari)" error={err('sisa_cuti')}>
              {(a) => <input {...a} type="number" min="0" max="365" value={values.sisa_cuti} onChange={onChange} className={inputClass} />}
            </Field>
          </div>
        </fieldset>

        <fieldset className={cardClass}>
          <legend className="sr-only">Gaji dan rekening</legend>
          <h2 className="text-sm font-semibold text-gray-900">Gaji dan rekening</h2>
          <div className="form-grid mt-5">
            <Field name="gaji_pokok" label="Gaji pokok per bulan (Rp)" error={err('gaji_pokok')}>
              {(a) => <input {...a} type="number" min="0" step="1000" inputMode="decimal" value={values.gaji_pokok} onChange={onChange} className={inputClass} />}
            </Field>
            <Field name="nama_bank" label="Nama bank">
              {(a) => <input {...a} type="text" value={values.nama_bank} onChange={onChange} maxLength={100} className={inputClass} />}
            </Field>
            <Field name="no_rekening" label="No. rekening" error={err('no_rekening')}>
              {(a) => <input {...a} type="text" inputMode="numeric" value={values.no_rekening} onChange={onChange} maxLength={30} className={inputClass} />}
            </Field>
            <Field name="nama_pemilik_rekening" label="Nama pemilik rekening">
              {(a) => <input {...a} type="text" value={values.nama_pemilik_rekening} onChange={onChange} maxLength={150} className={inputClass} />}
            </Field>
          </div>
        </fieldset>

        <fieldset className={cardClass}>
          <legend className="sr-only">Dokumen</legend>
          <h2 className="text-sm font-semibold text-gray-900">Dokumen</h2>
          <div className="mt-5">
            <Field name="dokumen_ktp" label="Scan KTP" error={err('dokumen_ktp')} hint="JPG, PNG, atau PDF, maksimal 4 MB. (Versi demo: hanya nama berkas yang disimpan.)">
              {(a) => (
                <input {...a} type="file" accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf" onChange={onFile}
                  className="block w-full text-xs text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:text-xs file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
              )}
            </Field>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button to={editing ? `/karyawan/${employee.id_karyawan}` : '/karyawan'} variant="outline">Batal</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah karyawan'}</Button>
        </div>
      </form>
    </>
  );
}
