import { createContext, useContext } from 'react';

export const SettingsContext = createContext(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings harus dipakai di dalam <SettingsProvider>');
  return ctx;
};
