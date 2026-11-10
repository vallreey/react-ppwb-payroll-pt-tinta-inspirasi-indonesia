import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { userService } from '../services/userService';
import { ROLE_LABELS } from '../utils/format';
import { email as emailRule, nik as nikRule, password as passwordRule, required, validate } from '../utils/validators';
import Field from '../components/Field';
import Icon from '../components/Icon';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { ErrorState, ListSkeleton } from '../components/StateViews';
import { cardClass, inputClass, selectClass } from '../components/ui';

export default function UserFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  useDocumentTitle(editing ? 'Ubah Akun' : 'Buat Akun');
  const { data, loading, error, reload } = useFetch(async () => (editing ? userService.get(id) : { user: null }), [id]);
  if (loading) return <ListSkeleton rows={5} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return <UserForm editing={editing} account={data.user} />;
}

function UserForm({ editing, account }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState({ role: account?.role ?? 'karyawan', email: account?.email ?? '', username: account?.username ?? '', password: '', nama_lengkap: '', nik: '' });
  const [pw, setPw] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [pwErrors, setPwErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const isAdmin = values.role === 'super_admin';
  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const rules = {
      email: [required('Email'), emailRule],
      username: [(v, all) => (all.role === 'super_admin' && !v.trim() ? 'Username wajib untuk Super Admin.' : '')],
      ...(editing ? {} : { password: [required('Kata sandi awal'), passwordRule], nama_lengkap: [(v, all) => (all.role !== 'super_admin' ? required('Nama lengkap')(v) : '')], nik: [(v, all) => (all.role !== 'super_admin' ? required('NIK')(v) || nikRule(v) : '')] }),
    };
    const found = validate(values, rules);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      if (editing) await userService.update(account.id_pengguna, values);
      else await userService.create(values);
      toast.success(editing ? 'Akun diperbarui.' : 'Akun berhasil dibuat.');
      navigate('/pengguna');
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors); else toast.error(err.message);
      setBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const found = validate({ password: pw.password, confirm: pw.confirm }, {
      password: [required('Kata sandi baru'), passwordRule],
      confirm: [required('Ulangi kata sandi'), (v) => (v !== pw.password ? 'Konfirmasi kata sandi tidak sama.' : '')],
    });
    setPwErrors(found);
    if (Object.keys(found).length) return;
    try {
      await userService.changePassword(account.id_pengguna, pw.password);
      setPw({ password: '', confirm: '' });
      toast.success('Kata sandi diganti.');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader title={editing ? 'Ubah Akun' : 'Buat Akun'} subtitle={editing ? account.email : 'Akun langsung aktif dan disetujui'} />
      <form onSubmit={submit} noValidate className={`${cardClass} max-w-3xl`}>
        <div className="form-grid">
          <Field name="role" label="Peran" required>
            {(a) => (
              <div className="relative">
                <select {...a} value={values.role} onChange={onChange} className={selectClass}>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500"><Icon name="chevron-down" className="size-4" /></span>
              </div>
            )}
          </Field>
          <Field name="email" label="Email" error={errors.email} required>{(a) => <input {...a} type="email" value={values.email} onChange={onChange} maxLength={150} autoComplete="off" className={inputClass} />}</Field>
          <Field name="username" label="Username" error={errors.username} hint="Wajib untuk Super Admin (dipakai sebagai nama tampil).">{(a) => <input {...a} type="text" value={values.username} onChange={onChange} maxLength={100} className={inputClass} />}</Field>
          {!editing && <Field name="password" label="Kata sandi awal" error={errors.password} hint="Minimal 8 karakter, mengandung huruf dan angka." required>{(a) => <input {...a} type="password" value={values.password} onChange={onChange} autoComplete="new-password" className={inputClass} />}</Field>}
          {!editing && !isAdmin && <Field name="nama_lengkap" label="Nama lengkap" error={errors.nama_lengkap} required>{(a) => <input {...a} type="text" value={values.nama_lengkap} onChange={onChange} maxLength={150} className={inputClass} />}</Field>}
          {!editing && !isAdmin && <Field name="nik" label="Employee ID (NIK)" error={errors.nik} hint="Unik; huruf, angka, titik, strip." required>{(a) => <input {...a} type="text" value={values.nik} onChange={onChange} maxLength={20} className={inputClass} />}</Field>}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button to="/pengguna" variant="outline">Batal</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat akun'}</Button>
        </div>
      </form>

      {editing && (
        <form onSubmit={changePassword} noValidate className={`${cardClass} mt-6 max-w-3xl`}>
          <h2 className="text-sm font-semibold text-gray-900">Ganti kata sandi</h2>
          <div className="form-grid mt-5">
            <Field name="newpw" label="Kata sandi baru" error={pwErrors.password} hint="Minimal 8 karakter, mengandung huruf dan angka." required>{(a) => <input {...a} type="password" value={pw.password} onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" className={inputClass} />}</Field>
            <Field name="newpw2" label="Ulangi kata sandi baru" error={pwErrors.confirm} required>{(a) => <input {...a} type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" className={inputClass} />}</Field>
          </div>
          <div className="mt-6 flex justify-end"><Button type="submit" variant="blue"><Icon name="key" className="size-4" /> Ganti kata sandi</Button></div>
        </form>
      )}
    </>
  );
}
