import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { email as emailRule, required, validate } from '../utils/validators';
import Field from '../components/Field';
import { inputClass } from '../components/ui';
import Button from '../components/Button';
import companyLogo from '../assets/logo perusahaan 2.png';

const rules = { email: [required('Email'), emailRule], password: [required('Password')] };

export default function LoginPage() {
  useDocumentTitle('Login');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const notice = location.state?.status;
  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, rules);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await login(values);
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main" className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-md">
        <img src={companyLogo} alt="PT. Tinta Inspirasi Indonesia" className="mx-auto mb-6 h-20 w-auto" width="80" height="80" />
        {notice && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}

        <h1 className="text-center text-3xl font-bold text-gray-900">Login</h1>
        <p className="mt-2 text-center text-gray-500">Selamat Datang Kembali</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <Field name="email" label="Email" error={errors.email} required>
            {(a11y) => <input {...a11y} type="email" value={values.email} onChange={onChange} autoComplete="username" placeholder="nama@perusahaan.co.id" autoFocus className={inputClass} />}
          </Field>
          <Field name="password" label="Password" error={errors.password} required>
            {(a11y) => <input {...a11y} type="password" value={values.password} onChange={onChange} autoComplete="current-password" placeholder="Password" className={inputClass} />}
          </Field>

          {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

          <Button type="submit" disabled={busy} className="w-full py-3.5 text-base font-semibold">
            {busy ? 'Memproses…' : 'Login'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Belum punya akun? <Link to="/register" className="font-medium text-indigo-600 hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
