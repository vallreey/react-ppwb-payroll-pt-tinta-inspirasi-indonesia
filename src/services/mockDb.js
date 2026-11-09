import { apiClient } from './apiClient';
import { toISODate } from '../utils/format';

const OVERLAY_KEY = (name) => `ti_overlay_${name}`;
const SESSION_KEY = 'ti_session';

const readOverlay = (name) => {
  try {
    return JSON.parse(localStorage.getItem(OVERLAY_KEY(name))) ?? {};
  } catch {
    return {};
  }
};

const writeOverlay = (name, overlay) => {
  try {
    localStorage.setItem(OVERLAY_KEY(name), JSON.stringify(overlay));
  } catch {
    throw new Error('Penyimpanan peramban penuh. Hapus data demo dari halaman Pengaturan.');
  }
};

const normalizers = {
  users: (rows) =>
    rows.map(({ terakhir_aktif_menit, ...u }) => ({
      ...u,
      terakhir_aktif: terakhir_aktif_menit == null ? null : new Date(Date.now() - terakhir_aktif_menit * 60000).toISOString(),
    })),
  attendance: (rows) =>
    rows.flatMap(({ hari_lalu, ...a }) => {
      const d = new Date();
      d.setDate(d.getDate() - hari_lalu);
      if (d.getDay() === 0 || d.getDay() === 6) return [];
      return [{ ...a, tanggal: toISODate(d) }];
    }),
};

export const readCollection = async (name, idField) => {
  const { data } = await apiClient.get(`${name}.json`);
  const base = normalizers[name] ? normalizers[name](data) : data;
  const overlay = readOverlay(name);
  const merged = base.map((row) => overlay[row[idField]] ?? row);
  const baseIds = new Set(base.map((row) => row[idField]));
  const created = Object.values(overlay).filter((row) => !baseIds.has(row[idField]));
  return [...merged, ...created];
};

export const saveRecord = (name, idField, record) => {
  const overlay = readOverlay(name);
  overlay[record[idField]] = record;
  writeOverlay(name, overlay);
  return record;
};

export const nextId = (rows, idField) => rows.reduce((max, row) => Math.max(max, row[idField]), 0) + 1;

export const readObject = async (name) => {
  const { data } = await apiClient.get(`${name}.json`);
  const overlay = readOverlay(name);
  return { ...data, ...overlay };
};
export const saveObject = (name, value) => {
  writeOverlay(name, value);
  return value;
};

export const sessionStore = {
  get: () => localStorage.getItem(SESSION_KEY),
  set: (id) => localStorage.setItem(SESSION_KEY, String(id)),
  clear: () => localStorage.removeItem(SESSION_KEY),
};

export const resetMockData = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('ti_overlay_') || key === SESSION_KEY)
    .forEach((key) => localStorage.removeItem(key));
};
