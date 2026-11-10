import { readObject, saveObject } from './mockDb';

export const DEFAULT_SETTINGS = {
  nama_perusahaan: 'PT. Tinta Inspirasi Indonesia',
  work_start: '09:00',
  work_end: '16:00',
  early_minutes: 30,
  work_days: [1, 2, 3, 4, 5],
  office_lat: -6.9175,
  office_long: 107.6191,
};

export const settingsService = {
  get: () => readObject('settings'),
  save: async (values) => saveObject('settings', values),
};
