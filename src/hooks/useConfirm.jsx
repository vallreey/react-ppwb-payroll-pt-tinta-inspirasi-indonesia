import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export const useConfirm = () => {
  const [request, setRequest] = useState(null);

  const confirm = useCallback(
    (options) => new Promise((resolve) => setRequest({ ...options, resolve })),
    [],
  );
  const settle = (value) => {
    request?.resolve(value);
    setRequest(null);
  };

  const dialog = (
    <ConfirmDialog
      open={Boolean(request)}
      title={request?.title ?? ''}
      message={request?.message ?? ''}
      confirmLabel={request?.confirmLabel}
      tone={request?.tone}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
  return [confirm, dialog];
};
