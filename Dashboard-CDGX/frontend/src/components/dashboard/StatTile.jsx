import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import Sparkline from './Sparkline';

/**
 * Compact KPI stat tile: label · value · optional signed delta (color =
 * direction × whether up is good) · optional sparkline or severity meter.
 */
const StatTile = ({ label, value, unit, icon, iconColor, delta, deltaUp, upIsGood = true, note, spark, meter, t }) => {
  const deltaGood = deltaUp === upIsGood;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: t.card, borderColor: t.border }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.inkMuted }}>
            {label}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <p className="text-2xl font-bold leading-none tracking-tight" style={{ color: t.inkPrimary }}>
              {value}
              {unit && (
                <span className="ml-1 text-sm font-medium" style={{ color: t.inkSecondary }}>
                  {unit}
                </span>
              )}
            </p>
            {delta && (
              <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: deltaGood ? t.goodText : t.criticalText }}>
                <FontAwesomeIcon icon={deltaUp ? faArrowUp : faArrowDown} className="text-[9px]" />
                {delta}
                <span style={{ color: t.inkMuted }}>/ 1 h</span>
              </span>
            )}
          </div>
          {note && (
            <p className="mt-1 truncate text-[11px]" style={{ color: t.inkMuted }}>
              {note}
            </p>
          )}
          {meter != null && (
            <div className="mt-2 h-1.5 w-full min-w-[140px] overflow-hidden rounded-full" style={{ background: t.seriesTrack }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, meter)}%`,
                  background: meter >= 98 ? t.good : meter >= 95 ? t.warning : t.critical,
                }}
              />
            </div>
          )}
        </div>

        {spark ? (
          <div className="hidden shrink-0 sm:block">
            <Sparkline data={spark} color={t.series} surface={t.card} width={110} height={34} />
          </div>
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm"
            style={{ background: t.cardSoft, color: iconColor ?? t.series }}
          >
            <FontAwesomeIcon icon={icon} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatTile;
