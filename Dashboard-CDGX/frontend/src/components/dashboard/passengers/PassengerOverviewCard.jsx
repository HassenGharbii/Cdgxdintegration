import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';
import ChartCard from '../ChartCard';
import PassengerEvolutionChart from './PassengerEvolutionChart';

const MiniStat = ({ label, value, delta, t }) => (
  <div className="rounded-xl px-3 py-2.5" style={{ background: t.cardSoft }}>
    <p className="truncate text-[11px] font-medium" style={{ color: t.inkMuted }}>
      {label}
    </p>
    <p className="mt-1 text-2xl font-bold leading-none tracking-tight" style={{ color: t.inkPrimary }}>
      {value}
    </p>
    <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] font-semibold" style={{ color: t.goodText }}>
      <FontAwesomeIcon icon={faArrowTrendUp} className="text-[9px]" />
      {delta}
    </p>
  </div>
);

/** KPI strip + daily evolution chart for the passenger-counting overview. */
const PassengerOverviewCard = ({ kpis, evolution, t }) => (
  <ChartCard title="Comptage passagers — Vue d'ensemble" t={t} className="h-full">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MiniStat
        label="Total passagers (7j)"
        value={kpis.totalPassagers.toLocaleString('fr-FR')}
        delta={`+${kpis.deltaTotal}% vs période préc.`}
        t={t}
      />
      <MiniStat
        label="Montées (7j)"
        value={kpis.montees.toLocaleString('fr-FR')}
        delta={`+${kpis.deltaMontees}%`}
        t={t}
      />
      <MiniStat
        label="Descentes (7j)"
        value={kpis.descentes.toLocaleString('fr-FR')}
        delta={`+${kpis.deltaDescentes}%`}
        t={t}
      />
      <MiniStat
        label="Taux d'occupation moyen"
        value={`${kpis.occupationMoy}%`}
        delta={`+${kpis.deltaOccupation} pts`}
        t={t}
      />
    </div>
    <div className="mt-4">
      <p className="text-xs font-semibold" style={{ color: t.inkSecondary }}>
        Évolution du nombre de passagers
      </p>
      <PassengerEvolutionChart evolution={evolution} t={t} />
    </div>
  </ChartCard>
);

export default PassengerOverviewCard;
