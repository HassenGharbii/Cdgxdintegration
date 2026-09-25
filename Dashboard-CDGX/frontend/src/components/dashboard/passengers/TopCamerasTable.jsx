import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

/** Top cameras by passenger volume — cameras arrive pre-sorted by total. */
const TopCamerasTable = ({ cameras, t, onSeeAll }) => {
  const top = cameras.slice(0, 5);

  return (
    <section className="rounded-2xl border shadow-sm transition-colors duration-300" style={{ background: t.card, borderColor: t.border }}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: t.inkPrimary }}>
            Top caméras par passages (7j)
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: t.inkMuted }}>
            Caméras les plus sollicitées, toutes voitures confondues
          </p>
        </div>
      </header>
      <div className="overflow-x-auto dashboard-scroll px-5 pb-3 pt-3">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {['Caméra', 'Voiture', 'Montées', 'Descentes', 'Total', 'Occupation moy.'].map((label, i) => (
                <th
                  key={label}
                  className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ${i >= 2 && i <= 4 ? 'text-right' : 'text-left'}`}
                  style={{ color: t.inkMuted }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((c) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: t.inkPrimary }}>
                  {c.name} · {c.porte}
                </td>
                <td className="px-3 py-2.5 text-xs" style={{ color: t.inkSecondary }}>
                  {c.voiture}
                </td>
                <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums" style={{ color: t.inkPrimary }}>
                  {c.montees.toLocaleString('fr-FR')}
                </td>
                <td className="px-3 py-2.5 text-right text-xs font-semibold tabular-nums" style={{ color: t.inkPrimary }}>
                  {c.descentes.toLocaleString('fr-FR')}
                </td>
                <td className="px-3 py-2.5 text-right text-xs font-bold tabular-nums" style={{ color: t.inkPrimary }}>
                  {c.total.toLocaleString('fr-FR')}
                </td>
                <td className="px-3 py-2.5 text-xs font-semibold tabular-nums" style={{ color: t.inkSecondary }}>
                  {c.occupationMoy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={onSeeAll}
        className="flex items-center gap-1.5 px-5 pb-5 pt-1 text-xs font-semibold transition-opacity hover:opacity-75"
        style={{ color: t.series }}
      >
        Voir toutes les caméras
        <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
      </button>
    </section>
  );
};

export default TopCamerasTable;
