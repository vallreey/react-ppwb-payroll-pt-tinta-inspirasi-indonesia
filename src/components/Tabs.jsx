import { useRef } from 'react';

export default function Tabs({ tabs, active, onChange, label, className = '' }) {
  const refs = useRef({});

  const onKeyDown = (e) => {
    const index = tabs.findIndex((t) => t.id === active);
    let next = null;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next !== null) {
      e.preventDefault();
      onChange(tabs[next].id);
      refs.current[tabs[next].id]?.focus();
    }
  };

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={`flex gap-6 border-b border-gray-200 px-5 pt-5 ${className}`}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[tab.id] = el; }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`-mb-px flex items-center gap-1.5 border-b-4 pb-2.5 text-xs font-medium ${selected ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {tab.label}
            {tab.badge > 0 && <span className="rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold leading-5 text-white">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
