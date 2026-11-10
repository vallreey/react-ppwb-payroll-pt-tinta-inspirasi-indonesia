
import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { profileService } from '../services/profileService';
import {
  formatDateLong,
  ROLE_LABELS,
  STATUS_KEPEGAWAIAN
} from '../utils/format';

import Icon from '../components/Icon';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Field from '../components/Field';
import PageHeader from '../components/PageHeader';

import {
  ErrorState,
  ListSkeleton
} from '../components/StateViews';

import {
  cardClass,
  inputClass,
  selectClass,
  textareaClass
} from '../components/ui';

import defaultProfileImage from '../assets/profile.png';

const EMPTY_PASSWORD = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

function DetailItem({ label, value }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <dt className="text-[11px] text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-xs font-medium text-gray-900">
        {value || '-'}
      </dd>
    </div>
  );
}

const readPhoto = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Foto gagal dibaca.'));

  reader.readAsDataURL(file);
});

export default function ProfilePage() {
  useDocumentTitle('Profil Saya');

  const { user, refresh } = useAuth();

  const { data, loading, error, reload } = useFetch(
    () => profileService.get(user.id_pengguna),
    [user.id_pengguna],
  );

  if (loading) return <ListSkeleton rows={7} />;

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={reload}
        title="Profil gagal dimuat"
      />
    );
  }

  return (
    <ProfileContent
      key={user.id_pengguna}
      user={user}
      data={data}
      refresh={refresh}
      reload={reload}
    />
  );
}

function ProfileContent({ user, data, refresh, reload }) {
  const toast = useToast();
  const photoInputRef = useRef(null);

  const employee = data?.employee ?? null;
  const account = data?.user ?? user;

  const [values, setValues] = useState(() => ({
    nama_lengkap:
      employee?.nama_lengkap ??
      account?.nama_tampil ??
      account?.username ?? '',
    email: account?.email ?? '',
    no_telepon: employee?.no_telepon ?? '',
    tanggal_lahir: employee?.tanggal_lahir ?? '',
    jenis_kelamin: employee?.jenis_kelamin ?? '',
    alamat: employee?.alamat ?? '',
    foto_profil:
      employee?.foto_profil ??
      account?.foto_profil ?? '',
  }));

  const [passwordValues, setPasswordValues] =
    useState(EMPTY_PASSWORD);

  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const onProfileChange = (event) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  // Upload foto profil
  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = '';
    setPhotoError('');

    if (!file) return;

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setPhotoError('Foto harus menggunakan format PNG atau JPG.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setPhotoError('Ukuran foto maksimal 1 MB.');
      return;
    }

    try {
      const photo = await readPhoto(file);

      setValues((current) => ({
        ...current,
        foto_profil: photo,
      }));
    } catch (readError) {
      setPhotoError(readError.message);
    }
  };

  // Simpan perubahan profil
  const saveProfile = async (event) => {
    event.preventDefault();

    if (photoError) {
      toast.error(photoError);
      return;
    }

    setSavingProfile(true);
    setErrors({});

    try {
      await profileService.update(user.id_pengguna, values);

      await refresh();
      await reload();

      toast.success('Profil berhasil diperbarui.');
    } catch (saveError) {
      if (saveError.fieldErrors) {
        setErrors(saveError.fieldErrors);
      }

      toast.error(
        saveError.message || 'Profil gagal diperbarui.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Input password
  const onPasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Simpan password baru
  const savePassword = async (event) => {
    event.preventDefault();

    if (
      passwordValues.new_password !==
      passwordValues.confirm_password
    ) {
      toast.error('Konfirmasi password baru tidak sama.');
      return;
    }

    setSavingPassword(true);

    try {
      await profileService.changePassword(
        user.id_pengguna,
        passwordValues.current_password,
        passwordValues.new_password,
      );

      setPasswordValues(EMPTY_PASSWORD);

      toast.success('Password berhasil diubah.');
    } catch (passwordError) {
      toast.error(
        passwordError.message || 'Password gagal diubah.'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel =
    ROLE_LABELS[account?.role] ?? account?.role ?? '-';

  const employmentLabel = employee
    ? STATUS_KEPEGAWAIAN[employee.status_kepegawaian] ??
      employee.status_kepegawaian
    : 'Akun administratif';

  return (
    <>
      <PageHeader
        title="Profil Saya"
        subtitle="Kelola informasi pribadi dan keamanan akun Anda"
      />

      <section className={`${cardClass} mb-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

          <div className="relative size-24 shrink-0">
            <img
              src={values.foto_profil || defaultProfileImage}
              alt="Foto profil"
              className="size-24 rounded-full border-4 border-white object-cover shadow-md"
            />

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              aria-label="Ubah foto profil"
              className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow hover:bg-blue-700"
            >
              <Icon name="camera" size={15} />
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              onChange={onPhotoChange}
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {values.nama_lengkap}
              </h2>

              <Badge tone="sky">{roleLabel}</Badge>
            </div>

            <p className="mt-1 break-all text-xs text-gray-500">
              {values.email}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {employee?.jabatan || roleLabel}
              {employee?.department?.nama_departemen
                ? ` · ${employee.department.nama_departemen}`
                : ''}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="!h-8 !rounded-lg !px-3 !text-[11px]"
                onClick={() => photoInputRef.current?.click()}
              >
                <Icon name="camera" size={14} />
                Ganti foto
              </Button>

              {values.foto_profil && (
                <Button
                  type="button"
                  variant="outline"
                  className="!h-8 !rounded-lg !px-3 !text-[11px]"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      foto_profil: '',
                    }))
                  }
                >
                  Hapus foto
                </Button>
              )}

              <span className="text-[10px] text-gray-400">
                PNG/JPG, maksimal 1 MB
              </span>
            </div>

            {photoError && (
              <p role="alert" className="mt-2 text-xs text-red-600">
                {photoError}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">

        <div className="space-y-6">

          <form onSubmit={saveProfile} className={cardClass}>
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-900">
                Informasi Pribadi
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Perbarui informasi kontak dan data pribadi Anda.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <Field
                name="nama_lengkap"
                label={employee ? 'Nama lengkap' : 'Nama tampilan'}
                error={errors.nama_lengkap}
                required
              >
                {(props) => (
                  <input
                    {...props}
                    value={values.nama_lengkap}
                    onChange={onProfileChange}
                    className={inputClass}
                    maxLength={100}
                  />
                )}
              </Field>

              <Field
                name="email"
                label="Email akun"
                error={errors.email}
                required
              >
                {(props) => (
                  <input
                    {...props}
                    type="email"
                    value={values.email}
                    onChange={onProfileChange}
                    className={inputClass}
                    maxLength={150}
                  />
                )}
              </Field>

              {employee && (
                <>
                  <Field
                    name="no_telepon"
                    label="Nomor telepon"
                    error={errors.no_telepon}
                  >
                    {(props) => (
                      <input
                        {...props}
                        type="tel"
                        value={values.no_telepon}
                        onChange={onProfileChange}
                        className={inputClass}
                        placeholder="Contoh: 081234567890"
                        maxLength={20}
                      />
                    )}
                  </Field>

                  <Field
                    name="tanggal_lahir"
                    label="Tanggal lahir"
                    error={errors.tanggal_lahir}
                  >
                    {(props) => (
                      <input
                        {...props}
                        type="date"
                        value={values.tanggal_lahir}
                        onChange={onProfileChange}
                        className={inputClass}
                        max={new Date().toISOString().slice(0, 10)}
                      />
                    )}
                  </Field>

                  <Field
                    name="jenis_kelamin"
                    label="Jenis kelamin"
                    error={errors.jenis_kelamin}
                  >
                    {(props) => (
                      <select
                        {...props}
                        value={values.jenis_kelamin}
                        onChange={onProfileChange}
                        className={selectClass}
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    )}
                  </Field>

                  <Field
                    name="alamat"
                    label="Alamat"
                    error={errors.alamat}
                    className="sm:col-span-2"
                  >
                    {(props) => (
                      <textarea
                        {...props}
                        rows={3}
                        value={values.alamat}
                        onChange={onProfileChange}
                        className={textareaClass}
                        maxLength={300}
                        placeholder="Masukkan alamat tempat tinggal"
                      />
                    )}
                  </Field>
                </>
              )}
            </div>

            {!employee && (
              <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                Akun ini belum terhubung dengan data karyawan.
                Anda dapat memperbarui nama tampilan, email,
                dan foto profil.
              </p>
            )}

            {errors.foto_profil && (
              <p role="alert" className="mt-3 text-xs text-red-600">
                {errors.foto_profil}
              </p>
            )}

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile
                  ? 'Menyimpan...'
                  : 'Simpan perubahan'}
              </Button>
            </div>
          </form>

          <form onSubmit={savePassword} className={cardClass}>
            <div className="mb-5 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon name="key" size={19} />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Keamanan Akun
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Ubah password untuk menjaga keamanan akun Anda.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Field
                name="current_password"
                label="Password saat ini"
                required
              >
                {(props) => (
                  <input
                    {...props}
                    type="password"
                    autoComplete="current-password"
                    value={passwordValues.current_password}
                    onChange={onPasswordChange}
                    className={inputClass}
                  />
                )}
              </Field>

              <Field
                name="new_password"
                label="Password baru"
                hint="Gunakan minimal 8 karakter."
                required
              >
                {(props) => (
                  <input
                    {...props}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwordValues.new_password}
                    onChange={onPasswordChange}
                    className={inputClass}
                  />
                )}
              </Field>

              <Field
                name="confirm_password"
                label="Konfirmasi password baru"
                required
              >
                {(props) => (
                  <input
                    {...props}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={passwordValues.confirm_password}
                    onChange={onPasswordChange}
                    className={inputClass}
                  />
                )}
              </Field>
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Memproses...' : 'Ubah password'}
              </Button>
            </div>
          </form>
        </div>

        <aside className={cardClass}>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Icon name="employees" size={19} />
            </span>

            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Informasi Kepegawaian
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Data pekerjaan yang terdaftar.
              </p>
            </div>
          </div>

          {employee ? (
            <dl className="mt-4">
              <DetailItem label="NIK / Employee ID" value={employee.nik} />
              <DetailItem label="Jabatan" value={employee.jabatan} />

              <DetailItem
                label="Departemen"
                value={employee.department?.nama_departemen}
              />

              <DetailItem
                label="Atasan langsung"
                value={employee.supervisor?.nama_lengkap}
              />

              <DetailItem
                label="Status kepegawaian"
                value={employmentLabel}
              />

              <DetailItem
                label="Tanggal masuk"
                value={
                  employee.tanggal_masuk
                    ? formatDateLong(employee.tanggal_masuk)
                    : '-'
                }
              />

              <DetailItem
                label="Sisa cuti tahunan"
                value={`${Number(employee.sisa_cuti ?? 0)} hari`}
              />

              <DetailItem
                label="Status akun"
                value={account?.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
              />
            </dl>
          ) : (
            <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
              Data kepegawaian tidak tersedia untuk akun ini.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}