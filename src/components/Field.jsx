export default function Field({ name, label, error, hint, required = false, className = '', children }) {
  const id = `field-${name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}
        {required && <span aria-hidden="true" className="text-red-500"> *</span>}
      </label>
      {children({
        id,
        name,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {hint && <p id={hintId} className="mt-1 text-[11px] text-gray-500">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
