import { SettingsContext } from './SettingsContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, settingsService } from '../services/settingsService';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService
      .get()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (values) => {
    await settingsService.save(values);
    setSettings(values);
  }, []);

  const value = useMemo(() => ({ settings, loading, save }), [settings, loading, save]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
