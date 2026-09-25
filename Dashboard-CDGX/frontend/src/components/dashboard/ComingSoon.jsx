import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/** Placeholder content for dashboard views that don't have a feature yet. */
const ComingSoon = ({ t, icon, title, description }) => (
  <div
    className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border px-6 py-20 text-center fade-up"
    style={{ borderColor: t.border, background: t.card }}
  >
    <div
      className="flex h-14 w-14 items-center justify-center rounded-2xl"
      style={{ background: t.seriesTrack, color: t.series }}
    >
      <FontAwesomeIcon icon={icon} className="text-xl" />
    </div>
    <div className="max-w-md">
      <h2 className="text-base font-bold tracking-tight" style={{ color: t.inkPrimary }}>
        {title}
      </h2>
      <p className="mt-1.5 text-sm" style={{ color: t.inkMuted }}>
        {description}
      </p>
    </div>
    <span
      className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ borderColor: t.border, color: t.warningText, background: t.cardSoft }}
    >
      Bientôt disponible
    </span>
  </div>
);

export default ComingSoon;
