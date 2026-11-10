import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from './Icon';
import { smoothScrollToTop } from '../utils/jqueryEffects';

export default function BackToTop() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={smoothScrollToTop}
      aria-label="Kembali ke atas halaman"
      className={`back-to-top-button no-print fixed bottom-4 right-4 z-40 flex size-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 ${pathname === '/karyawan' ? 'back-to-top-button--employee-list' : ''}`}
    >
      <Icon name="arrow-up" />
    </button>
  );
}
