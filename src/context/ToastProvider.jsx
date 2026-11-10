import { ToastContext } from './ToastContext';
import { useCallback, useMemo, useState } from 'react';
import Toast from '../components/Toast';

let counter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (message, type = 'success') => {
      const id = ++counter;
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error') }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="no-print fixed right-4 top-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
