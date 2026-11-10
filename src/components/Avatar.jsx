import { initials } from '../utils/format';

export default function Avatar({ name = '', size = 'size-10', className = '' }) {
  return (
    <span
      className={`${size} ${className} flex shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
