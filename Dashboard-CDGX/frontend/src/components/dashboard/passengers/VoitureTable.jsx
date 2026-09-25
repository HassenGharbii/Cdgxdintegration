import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import ChartCard from '../ChartCard';

/** Occupation is a magnitude (0-100%), not a status — a single sequential hue, no thresholds. */
const OccupationBar = ({ value, t }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: t.seriesTrack }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: t.series }} />
    </div>
    <span className="text-xs font-semibold tabular-nums" style={{ color: t.inkPrimary }}>
      {value}%
    </span>
  </div>
);

/** Per-voiture (wagon) passenger totals over the last 7 days. */
const VoitureTable = ({ voitures, t, onSeeAll }) => (
  <ChartCard title="Comptage par voiture (7j)" t={t} className="h-full">
    <div className="overflow-x-auto dashboard-scroll">
      <table className="w-full min-w-[360px] border-collapse">
        <thead>
          <tr style={{ borderBottom: `1px solid ${t.border}` }}>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.inkMuted }}>
              Voiture
            </th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.inkMuted }}>
              Montées
            </th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.inkMuted }}>
              Descentes
            </th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.inkMuted }}>
              Occupation moy.
            </th>
          </tr>
        </thead>
        <tbody>
          {voitures.map((v) => (
            <tr key={v.id} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: t.inkPrimary }}>
                {v.name}
              </td>
              <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums" style={{ color: t.inkPrimary }}>
                {v.montees.toLocaleString('fr-FR')}
              </td>
              <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums" style={{ color: t.inkPrimary }}>
                {v.descentes.toLocaleString('fr-FR')}
              </td>
              <td className="px-3 py-2.5">
                <OccupationBar value={v.occupationMoy} t={t} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
        style={{ color: t.series }}
      >
        Voir toutes les voitures
        <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
      </button>
    )}
  </ChartCard>
);

export default VoitureTable;
