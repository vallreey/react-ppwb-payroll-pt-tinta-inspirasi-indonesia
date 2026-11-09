import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function RowMenu({ label = 'Action', ariaLabel, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
    const onOutside = (e) => {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false);
    };
    const onViewport = () => setOpen(false);
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('scroll', onViewport, true);
    window.addEventListener('resize', onViewport);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('scroll', onViewport, true);
      window.removeEventListener('resize', onViewport);
    };
  }, [open]);

  const toggle = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 176) });
    setOpen((v) => !v);
  };

  const onKeyDown = (e) => {
    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const move = (i) => { e.preventDefault(); items[(i + items.length) % items.length]?.focus(); };
    if (e.key === 'ArrowDown') move(index + 1);
    else if (e.key === 'ArrowUp') move(index - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(items.length - 1);
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close();
  };

  return (
    <div className="inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-md border border-blue-600 bg-white px-3 py-1.5 text-xs text-gray-800 hover:bg-blue-50"
      >
        {label} <Icon name="chevron-down" className="size-4" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={onKeyDown}
          onClick={() => close()}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-44 rounded-xl bg-white p-1 text-left shadow-lg ring-1 ring-gray-100"
        >
          {children}
        </div>
      )}
    </div>
  );
}

const itemClass = (tone) =>
  `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs focus-visible:bg-gray-100 ${
    { default: 'text-gray-700 hover:bg-gray-50', danger: 'text-red-700 hover:bg-red-50', success: 'text-green-700 hover:bg-green-50' }[tone]
  }`;

export function RowMenuItem({ to, onClick, icon, tone = 'default', children }) {
  const content = (
    <>
      {icon && <Icon name={icon} className="size-4" />} {children}
    </>
  );
  if (to) {
    return <Link role="menuitem" to={to} className={itemClass(tone)}>{content}</Link>;
  }
  return <button type="button" role="menuitem" onClick={onClick} className={itemClass(tone)}>{content}</button>;
}
