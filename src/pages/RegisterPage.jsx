import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { email as emailRule, maxLength, nik as nikRule, password as passwordRule, required, validate } from '../utils/validators';
import Field from '../components/Field';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { inputClass } from '../components/ui';
import companyLogo from '../assets/logo perusahaan 2.png';
import buildings from '../assets/buildings.png';

const rules = {
  name: [required('Nama lengkap'), maxLength('Nama lengkap', 150)],
  nik: [required('NIK'), nikRule],
  email: [required('Email'), emailRule],
  password: [required('Password'), passwordRule],
};

export default function RegisterPage() {
  useDocumentTitle('Register');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', nik: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, rules);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await register(values);
      navigate('/login', { replace: true, state: { status: 'Registrasi berhasil. Akun Anda menunggu persetujuan Super Admin sebelum bisa dipakai login.' } });
    } catch (error) {
      if (error.fieldErrors) setErrors(error.fieldErrors);
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white lg:flex-row">
      <div className="relative flex w-full flex-col px-6 py-8 sm:px-10 lg:w-1/2 lg:px-16 lg:py-12">
        <div className="mb-8 flex items-center justify-between lg:mb-10">
          <img src={companyLogo} alt="PT. Tinta Inspirasi Indonesia" className="mx-auto h-16 w-auto sm:h-20 lg:mx-0 lg:h-24" width="96" height="96" />
          <Link to="/login" className="hidden items-center justify-center rounded-full border border-indigo-400 px-6 py-2 font-medium text-indigo-600 hover:bg-indigo-50 lg:inline-flex">
            Login
          </Link>
        </div>

        <main id="main" className="mx-auto w-full max-w-md lg:mx-0">
          <h1 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl lg:text-left">Register</h1>
          <p className="mt-2 text-center text-gray-500 lg:text-left">Selamat Datang di Perusahaan</p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <Field name="name" label="Nama Lengkap" error={errors.name} required>
              {(a11y) => <input {...a11y} type="text" value={values.name} onChange={onChange} autoComplete="name" className={inputClass} />}
            </Field>
            <Field name="nik" label="NIK" error={errors.nik} hint="Employee ID dari perusahaan. Huruf, angka, titik, strip." required>
              {(a11y) => <input {...a11y} type="text" value={values.nik} onChange={onChange} className={inputClass} />}
            </Field>
            <Field name="email" label="Email" error={errors.email} required>
              {(a11y) => <input {...a11y} type="email" value={values.email} onChange={onChange} autoComplete="username" className={inputClass} />}
            </Field>
            <Field name="password" label="Password" error={errors.password} hint="Minimal 8 karakter, mengandung huruf dan angka." required>
              {(a11y) => (
                <div className="relative">
                  <input {...a11y} type={showPassword ? 'text' : 'password'} value={values.password} onChange={onChange} autoComplete="new-password" className={`${inputClass} pr-12`} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="eye" className="size-5" />
                  </button>
                </div>
              )}
            </Field>

            {formError && !Object.keys(errors).length && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

            <Button type="submit" disabled={busy} className="w-full py-3.5 text-base font-semibold">
              {busy ? 'Mendaftarkan…' : 'Register'}
            </Button>
            <p className="text-center text-sm text-gray-500 lg:hidden">
              Sudah memiliki akun? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Login</Link>
            </p>
          </form>
        </main>
      </div>

      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <img src={buildings} alt="Gedung perkantoran" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      </div>
    </div>
  );
}
