import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faTriangleExclamation, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import ChartCard from './ChartCard';
import { TYPE_ICONS, FALLBACK_ICON } from './deviceIcons';

/**
 * Equipment needing attention: offline first, then degraded (RTT > 80 ms).
 * Rows are clickable → device detail panel. Status is icon + label, never
 * color alone.
 */
const Watchlist = ({ devices, t, onSelect }) => {
  const items = devices
    .filter((d) => !d.online || d.rtt_ms > 80)
    .sort((a, b) => Number(a.online) - Number(b.online) || (b.rtt_ms ?? 0) - (a.rtt_ms ?? 0));

  return (
    <ChartCard
      title="À surveiller"
      subtitle="Hors ligne et latences élevées — cliquer pour le détail"
      t={t}
      className="h-full"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <FontAwesomeIcon icon={faCircleCheck} className="text-2xl" style={{ color: t.good }} />
          <p className="text-sm font-semibold" style={{ color: t.inkPrimary }}>
            Tout est en ligne
          </p>
          <p className="text-xs" style={{ color: t.inkMuted }}>
            Aucun équipement ne nécessite d'attention
          </p>
        </div>
      ) : (
        <ul className="dashboard-scroll flex max-h-[300px] flex-col gap-1.5 overflow-y-auto pr-1">
          {items.map((d) => {
            const offline = !d.online;
            const color = offline ? t.critical : t.warning;
            const textColor = offline ? t.criticalText : t.warningText;
            return (
              <li key={d.id}>
                <button
                  onClick={() => onSelect?.(d)}
                  className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 hover:-translate-y-px"
                  style={{ borderColor: 'transparent', background: t.cardSoft }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs"
                    style={{ background: t.card, color: t.inkSecondary }}
                  >
                    <FontAwesomeIcon icon={TYPE_ICONS[d.type] ?? FALLBACK_ICON} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold" style={{ color: t.inkPrimary }}>
                      {d.name}
                    </p>
                    <p className="truncate font-mono text-[11px]" style={{ color: t.inkMuted }}>
                      {d.ip}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold" style={{ color: textColor }}>
                    <FontAwesomeIcon icon={offline ? faCircleXmark : faTriangleExclamation} style={{ color }} />
                    {offline ? 'Hors ligne' : `${d.rtt_ms} ms`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
};

export default Watchlist;
