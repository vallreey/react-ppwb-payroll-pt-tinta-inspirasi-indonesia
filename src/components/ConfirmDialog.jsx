import { useEffect, useRef } from 'react';
import Button from './Button';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Ya, lanjutkan', tone = 'primary', onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      onClick={(e) => { if (e.target === ref.current) onCancel(); }}
      className="m-auto w-[calc(100vw-2rem)] max-w-sm rounded-2xl p-0 shadow-xl backdrop:bg-gray-900/40"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-base font-semibold text-gray-900">{title}</h2>
        <p id="confirm-message" className="mt-2 text-xs text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>Batal</Button>
          <Button variant={tone === 'danger' ? 'blue' : 'primary'} className={tone === 'danger' ? '!bg-red-600 hover:!bg-red-700' : ''} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
