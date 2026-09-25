import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

/** Sticky glassy header: page title, live pulse, last update, theme toggle, admin. */
const TopBar = ({
  t,
  dark,
  onToggleDark,
  lastUpdate,
  isAdmin,
  onAdmin,
  title = 'Équipements',
  subtitle = 'Monitoring réseau · temps réel',
}) => (
  <header
    className="sticky top-0 z-30 border-b backdrop-blur-xl transition-colors duration-300"
    style={{ background: dark ? 'rgba(7,11,20,0.78)' : 'rgba(244,245,248,0.82)', borderColor: t.border }}
  >
    <div className="flex h-16 w-full items-center justify-between gap-4 px-3 sm:px-4">
      <div className="min-w-0">
        <h1 className="truncate text-base font-bold tracking-tight" style={{ color: t.inkPrimary }}>
          {title}
        </h1>
        <p className="truncate text-[11px]" style={{ color: t.inkMuted }}>
          {subtitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          className="hidden items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold sm:flex"
          style={{ borderColor: t.border, color: t.goodText, background: t.cardSoft }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: t.good }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: t.good }} />
          </span>
          EN DIRECT
        </span>

        {lastUpdate && (
          <span className="hidden text-xs tabular-nums md:block" style={{ color: t.inkMuted }}>
            MàJ {lastUpdate.toLocaleTimeString('fr-FR')}
          </span>
        )}

        <button
          onClick={onToggleDark}
          aria-label={dark ? 'Mode clair' : 'Mode sombre'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors duration-200 hover:opacity-80"
          style={{ borderColor: t.border, color: t.inkSecondary, background: t.cardSoft }}
        >
          <FontAwesomeIcon icon={dark ? faSun : faMoon} className="text-sm" />
        </button>

        {isAdmin && (
          <button
            onClick={onAdmin}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
          >
            <FontAwesomeIcon icon={faShieldAlt} />
            <span className="hidden sm:inline">Panel Admin</span>
          </button>
        )}
      </div>
    </div>
  </header>
);

export default TopBar;
