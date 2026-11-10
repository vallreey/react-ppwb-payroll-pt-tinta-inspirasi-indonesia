
const ID_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromISODate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const toTimeString = (date = new Date()) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

export const formatClock = (time) => (time ? time.slice(0, 5).replace(':', '.') : '-');

export const formatDateShort = (iso) => {
  if (!iso) return '-';
  const d = fromISODate(iso.slice(0, 10));
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

export const formatDateLong = (iso) => {
  if (!iso) return '-';
  const d = fromISODate(iso.slice(0, 10));
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateWithDay = (value) => {
  const d = value instanceof Date ? value : fromISODate(value.slice(0, 10));
  return `${ID_DAYS[d.getDay()]}, ${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${formatDateShort(toISODate(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatRupiah = (n) =>
  `Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(n) || 0)}`;

export const timeAgo = (iso) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
};

export const greetingNow = (date = new Date()) => {
  const h = date.getHours();
  if (h < 11) return 'Pagi';
  if (h < 15) return 'Siang';
  if (h < 18) return 'Sore';
  return 'Malam';
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  hrd: 'HRD',
  supervisor: 'Supervisor',
  direktur: 'CEO/Direktur',
  karyawan: 'Karyawan',
};

export const STATUS_KEPEGAWAIAN = { tetap: 'Permanent', kontrak: 'Contract', percobaan: 'Probation' };
export const GENDER = { L: 'Male', P: 'Female' };
