import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import ChartCard from './ChartCard';

/**
 * Top-10 slowest equipment as a ranked bar list (single hue — identity is
 * carried by the row label, not color). Values sit at the bar tip in ink;
 * a warning icon flags RTT above 80 ms. Rows are clickable → detail panel.
 */
const LatencyRanking = ({ devices, t, onSelect }) => {
  const ranked = devices
    .filter((d) => d.online && d.rtt_ms != null)
    .sort((a, b) => b.rtt_ms - a.rtt_ms)
    .slice(0, 10);
  const max = Math.max(...ranked.map((d) => d.rtt_ms), 1);

  return (
    <ChartCard
      title="Latences les plus élevées"
      subtitle="Top 10 des équipements joignables — cliquer pour l'historique"
      t={t}
      className="h-full"
    >
      <ul className="grid grid-cols-1 gap-x-10 gap-y-2 lg:grid-cols-2">
        {ranked.map((d) => (
          <li key={d.id}>
            <button
              onClick={() => onSelect?.(d)}
              className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-[rgba(148,163,184,0.08)]"
              title={`${d.name} · ${d.ip} · ${d.rtt_ms} ms`}
            >
              <div className="w-36 min-w-0 shrink-0 sm:w-40">
                <p className="truncate text-xs font-semibold" style={{ color: t.inkPrimary }}>
                  {d.name}
                </p>
                <p className="truncate font-mono text-[11px]" style={{ color: t.inkMuted }}>
                  {d.ip}
                </p>
              </div>
              <div className="h-3 flex-1 overflow-hidden rounded-full" style={{ background: t.cardSoft }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(d.rtt_ms / max) * 100}%`, background: t.series }}
                />
              </div>
              <div className="flex w-20 shrink-0 items-center justify-end gap-1.5">
                {d.rtt_ms > 80 && (
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="text-[11px]"
                    style={{ color: t.warning }}
                    title="Latence élevée"
                  />
                )}
                <span className="text-xs font-semibold tabular-nums" style={{ color: t.inkPrimary }}>
                  {d.rtt_ms}
                </span>
                <span className="text-[11px]" style={{ color: t.inkMuted }}>
                  ms
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
};

export default LatencyRanking;
