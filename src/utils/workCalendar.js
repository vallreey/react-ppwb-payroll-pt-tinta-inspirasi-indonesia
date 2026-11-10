import { fromISODate } from './format';

export const isoWeekday = (date) => (date.getDay() === 0 ? 7 : date.getDay());

export const isWorkingDay = (iso, settings) => settings.work_days.includes(isoWeekday(fromISODate(iso)));

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const timeToMinutes = (time) => toMinutes(time.slice(0, 5));

export const statusForCheckIn = (time, settings) =>
  timeToMinutes(time) > toMinutes(settings.work_start) ? 'terlambat' : 'hadir';

export const isEarly = (time, settings) =>
  timeToMinutes(time) <= toMinutes(settings.work_start) - Number(settings.early_minutes);

export const isLeftEarly = (time, settings) => timeToMinutes(time) < toMinutes(settings.work_end);

export const isAfterClosing = (settings, now = new Date()) =>
  now.getHours() * 60 + now.getMinutes() >= toMinutes(settings.work_end);

export const lastWorkingDay = (isoToday, settings) => {
  const d = fromISODate(isoToday);
  for (let i = 0; i < 8; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${dd}`;
    if (isWorkingDay(iso, settings)) return iso;
    d.setDate(d.getDate() - 1);
  }
  return isoToday;
};
