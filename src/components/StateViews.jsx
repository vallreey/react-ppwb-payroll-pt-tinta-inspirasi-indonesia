import Icon from './Icon';

export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} aria-hidden="true" />;

export function TableSkeleton({ rows = 6, cols = 5, label = 'Memuat data…' }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-3 p-1">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="stat-grid">
      <span className="sr-only">Memuat ringkasan…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-6 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      <span className="sr-only">Memuat daftar…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Data gagal dimuat' }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-600">
        <Icon name="x" className="size-6" />
      </span>
      <div>
        <p className="text-xs font-semibold text-red-800">{title}</p>
        <p className="mt-1 text-xs text-red-700">{error?.message ?? 'Terjadi kesalahan.'}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-xs font-medium text-red-700 hover:bg-red-100">
          <Icon name="refresh" className="size-4" /> Coba lagi
        </button>
      )}
    </div>
  );
}

export const EmptyState = ({ children }) => <div className="px-4 py-14 text-center text-xs text-gray-500">{children}</div>;
