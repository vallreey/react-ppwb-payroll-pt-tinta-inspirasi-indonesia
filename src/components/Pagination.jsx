import Icon from './Icon';

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const base = 'flex size-9 items-center justify-center rounded-full text-xs focus-visible:outline-2';

  return (
    <nav aria-label="Navigasi halaman" className="no-print mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya" className={`${base} bg-white shadow-card disabled:opacity-40`}>
        <Icon name="chevron-left" className="size-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span aria-hidden="true" className="text-gray-400">…</span>}
          <button
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Halaman ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`${base} ${p === page ? 'bg-blue-600 font-medium text-white' : 'bg-white text-gray-700 shadow-card hover:bg-blue-50'}`}
          >
            {p}
          </button>
        </span>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Halaman berikutnya" className={`${base} bg-white shadow-card disabled:opacity-40`}>
        <Icon name="chevron-right" className="size-4" />
      </button>
    </nav>
  );
}
