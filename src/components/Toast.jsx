import { useEffect, useRef } from 'react';
import Icon from './Icon';
import { fadeInElement } from '../utils/jqueryEffects';

export default function Toast({ toast, onClose }) {
  const ref = useRef(null);
  useEffect(() => fadeInElement(ref.current), []);

  const tone = toast.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800';
  return (
    <div ref={ref} role={toast.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs shadow-lg ${tone}`}>
      <p className="min-w-0 flex-1 break-words">{toast.message}</p>
      <button type="button" onClick={onClose} aria-label="Tutup pesan" className="rounded p-0.5 opacity-70 hover:opacity-100">
        <Icon name="x" className="size-4" />
      </button>
    </div>
  );
}
