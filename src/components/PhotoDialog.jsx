import { useEffect, useRef } from 'react';
import Button from './Button';

export default function PhotoDialog({ photo, title, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (photo && !dialog.open) dialog.showModal();
    if (!photo && dialog.open) dialog.close();
  }, [photo]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-auto w-[calc(100vw-2rem)] max-w-lg rounded-2xl p-0 shadow-xl backdrop:bg-gray-900/50"
    >
      {photo && (
        <div className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">{title}</h2>
          <img src={photo} alt={`${title} (foto bukti kehadiran)`} className="w-full rounded-xl object-cover" />
          <div className="mt-4 flex justify-end"><Button variant="outline" onClick={onClose}>Tutup</Button></div>
        </div>
      )}
    </dialog>
  );
}
