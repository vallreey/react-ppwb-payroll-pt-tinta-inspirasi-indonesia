import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useListFilters = (defaults) => {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, params.get(key) ?? fallback])),
    [params, defaults],
  );
  const page = Math.max(1, Number(params.get('page')) || 1);

  const setFilter = useCallback(
    (key, value) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      }, { replace: true });
    },
    [setParams],
  );

  const setPage = useCallback(
    (value) => setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(value));
      return next;
    }),
    [setParams],
  );

  const reset = useCallback(() => setParams({}, { replace: true }), [setParams]);
  const activeCount = (keys) => keys.filter((k) => filters[k]).length;

  return { filters, page, setFilter, setPage, reset, activeCount };
};
