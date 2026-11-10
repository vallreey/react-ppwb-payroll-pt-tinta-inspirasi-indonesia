import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { resetMockData } from '../services/mockDb';
import { maxLength, required, validate } from '../utils/validators';
import Field from '../components/Field';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { useConfirm } from '../hooks/useConfirm';
import { cardClass, inputClass } from '../components/ui';

const DAYS = [[1, 'Senin'], [2, 'Selasa'], [3, 'Rabu'], [4, 'Kamis'], [5, 'Jumat'], [6, 'Sabtu'], [7, 'Minggu']];

export default function SettingsPage() {
  useDocumentTitle('Settings');
  const { settings, save } = useSettings();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [values, setValues] = useState(settings);
  const [errors, setErrors] = useState({});

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  const toggleDay = (d) => setValues((v) => ({ ...v, work_days: v.work_days.includes(d) ? v.work_days.filter((x) => x !== d) : [...v.work_days, d].sort() }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, {
      nama_perusahaan: [required('Nama perusahaan'), maxLength('Nama perusahaan', 100)],
      work_start: [required('Jam masuk')],
      work_end: [required('Jam pulang'), (v, all) => (v <= all.work_start ? 'Jam pulang harus setelah jam masuk.' : '')],
      early_minutes: [(v) => (v === '' || Number(v) < 0 || Number(v) > 180 ? 'Isi 0–180 menit.' : '')],
      work_days: [(v) => (v.length ? '' : 'Pilih minimal satu hari kerja.')],
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    await save({ ...values, early_minutes: Number(values.early_minutes), office_lat: Number(values.office_lat), office_long: Number(values.office_long) });
    toast.success('Pengaturan disimpan.');
  };

  const reset = async () => {
    if (!(await confirm({ title: 'Reset data demo?', message: 'Semua perubahan yang tersimpan di peramban ini akan dihapus dan Anda akan keluar.', confirmLabel: 'Reset', tone: 'danger' }))) return;
    resetMockData();
    window.location.assign('/login');
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Pengaturan umum dan jam kerja" />
      <form onSubmit={onSubmit} noValidate className={`${cardClass} max-w-3xl`}>
        <div className="form-grid">
          <Field name="nama_perusahaan" label="Nama perusahaan" error={errors.nama_perusahaan} required className="md:col-span-2">{(a) => <input {...a} value={values.nama_perusahaan} onChange={onChange} className={inputClass} />}</Field>
          <Field name="work_start" label="Jam masuk" error={errors.work_start} required>{(a) => <input {...a} type="time" value={values.work_start} onChange={onChange} className={inputClass} />}</Field>
          <Field name="work_end" label="Jam pulang" error={errors.work_end} required>{(a) => <input {...a} type="time" value={values.work_end} onChange={onChange} className={inputClass} />}</Field>
          <Field name="early_minutes" label="Batas Early Clock In (menit sebelum jam masuk)" error={errors.early_minutes}>{(a) => <input {...a} type="number" min="0" max="180" value={values.early_minutes} onChange={onChange} className={inputClass} />}</Field>
          <fieldset className="md:col-span-2">
            <legend className="mb-1.5 text-xs font-medium text-gray-700">Hari kerja</legend>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(([d, l]) => (
                <label key={d} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="checkbox" checked={values.work_days.includes(d)} onChange={() => toggleDay(d)} /> {l}
                </label>
              ))}
            </div>
            {errors.work_days && <p role="alert" className="mt-1 text-xs text-red-600">{errors.work_days}</p>}
          </fieldset>
          <Field name="office_lat" label="Latitude kantor (untuk mode demo GPS)">{(a) => <input {...a} type="number" step="any" value={values.office_lat} onChange={onChange} className={inputClass} />}</Field>
          <Field name="office_long" label="Longitude kantor">{(a) => <input {...a} type="number" step="any" value={values.office_long} onChange={onChange} className={inputClass} />}</Field>
        </div>
        <div className="mt-6 flex justify-end"><Button type="submit">Simpan pengaturan</Button></div>
      </form>

      <section className={`${cardClass} mt-6 max-w-3xl`} aria-labelledby="demo-heading">
        <h2 id="demo-heading" className="text-sm font-semibold text-gray-900">Data demo</h2>
        <p className="mt-1 text-xs text-gray-600">Data berasal dari Mock API (berkas JSON); perubahan disimpan di localStorage peramban ini.</p>
        <Button variant="danger" className="mt-4" onClick={reset}>Reset data demo</Button>
      </section>
      {confirmDialog}
    </>
  );
}
