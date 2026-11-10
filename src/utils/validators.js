
export const required = (label) => (value) =>
  value === undefined || value === null || String(value).trim() === '' ? `${label} wajib diisi.` : '';

export const email = (value) =>
  value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? 'Format email tidak valid.' : '';

export const maxLength = (label, max) => (value) =>
  value && String(value).length > max ? `${label} maksimal ${max} karakter.` : '';

export const password = (value) => {
  if (!value) return '';
  if (value.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Kata sandi harus mengandung huruf dan angka.';
  return '';
};

export const nik = (value) =>
  value && !/^[A-Za-z0-9.-]{3,20}$/.test(value) ? 'NIK 3–20 karakter: huruf, angka, titik, strip.' : '';

export const phone = (value) =>
  value && !/^[0-9+\-\s]{8,20}$/.test(value) ? 'No. telepon hanya angka (8–20 digit).' : '';

export const nonNegativeNumber = (label) => (value) =>
  value !== '' && Number(value) < 0 ? `${label} tidak boleh negatif.` : '';

export const validate = (values, rules) =>
  Object.entries(rules).reduce((errors, [field, fieldRules]) => {
    const message = fieldRules.map((rule) => rule(values[field], values)).find(Boolean);
    return message ? { ...errors, [field]: message } : errors;
  }, {});
