import { BADGE_TONES } from './ui';

export default function Badge({ tone = 'gray', children }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-3 py-1 text-xs font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}
