import React from 'react';

/** Shared card shell: hairline border, soft shadow, title row + action slot. */
const ChartCard = ({ title, subtitle, action, children, t, className = '' }) => (
  <section
    className={`rounded-2xl border shadow-sm transition-colors duration-300 ${className}`}
    style={{ background: t.card, borderColor: t.border }}
  >
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
      <div>
        <h2 className="text-sm font-semibold tracking-tight" style={{ color: t.inkPrimary }}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: t.inkMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
    <div className="px-5 pb-5 pt-3">{children}</div>
  </section>
);

export default ChartCard;
