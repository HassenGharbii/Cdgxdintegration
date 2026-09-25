import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faSort,
  faSortUp,
  faSortDown,
} from '@fortawesome/free-solid-svg-icons';
import ChartCard from './ChartCard';
import Sparkline from './Sparkline';
import { TYPE_ICONS, FALLBACK_ICON } from './deviceIcons';

const STATUS_FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'online', label: 'En ligne' },
  { key: 'degraded', label: 'Dégradé' },
  { key: 'offline', label: 'Hors ligne' },
];

const statusOf = (d) => (!d.online ? 'offline' : d.rtt_ms > 80 ? 'degraded' : 'online');

/**
 * Fleet table: search, status filter, sortable columns. Rows are clickable
 * and open the device detail panel.
 */
const EquipmentTable = ({ devices, t, onSelect }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState({ key: 'name', dir: 1 });

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices
      .filter((d) => status === 'all' || statusOf(d) === status)
      .filter((d) => !q || [d.name, d.ip, d.type].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va == null && vb == null) return 0;
        if (va == null) return 1; // nulls (offline RTT) always last
        if (vb == null) return -1;
        return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * sort.dir;
      });
  }, [devices, query, status, sort]);

  const pill = (d) => {
    const conf = {
      online: { dot: t.good, text: t.goodText, label: 'En ligne' },
      degraded: { dot: t.warning, text: t.warningText, label: 'Dégradé' },
      offline: { dot: t.critical, text: t.criticalText, label: 'Hors ligne' },
    }[statusOf(d)];
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ color: conf.text, background: t.cardSoft }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: conf.dot }} />
        {conf.label}
      </span>
    );
  };

  const sortIcon = (key) =>
    sort.key !== key ? faSort : sort.dir === 1 ? faSortUp : faSortDown;

  const header = (label, key) => (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
        style={{ color: sort.key === key ? t.inkSecondary : t.inkMuted }}
      >
        {label}
        <FontAwesomeIcon icon={sortIcon(key)} className="text-[9px]" />
      </button>
    </th>
  );

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs"
          style={{ color: t.inkMuted }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher nom, IP, type…"
          className="h-8 w-52 rounded-lg border pl-8 pr-3 text-xs outline-none transition-all focus:w-64"
          style={{ background: t.cardSoft, borderColor: t.border, color: t.inkPrimary }}
        />
      </div>
      <div className="flex rounded-lg border p-0.5" style={{ borderColor: t.border, background: t.cardSoft }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150"
            style={status === f.key ? { background: t.series, color: '#fff' } : { color: t.inkMuted }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ChartCard
      title="Détails des équipements"
      subtitle={`${rows.length} équipement${rows.length > 1 ? 's' : ''} affiché${rows.length > 1 ? 's' : ''} sur ${devices.length} — cliquer sur une ligne pour l'historique`}
      action={controls}
      t={t}
    >
      <div className="overflow-x-auto dashboard-scroll">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {header('Équipement', 'name')}
              {header('Adresse IP', 'ip')}
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.inkMuted }}>
                Statut
              </th>
              {header('RTT (ms)', 'rtt_ms')}
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.inkMuted }}>
                Tendance
              </th>
              {header('Dernier contrôle', 'lastCheck')}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr
                key={d.id}
                onClick={() => onSelect?.(d)}
                className="cursor-pointer transition-colors duration-150 hover:bg-[rgba(148,163,184,0.07)]"
                style={{ borderBottom: `1px solid ${t.border}` }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs"
                      style={{ background: t.cardSoft, color: t.inkSecondary }}
                    >
                      <FontAwesomeIcon icon={TYPE_ICONS[d.type] ?? FALLBACK_ICON} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: t.inkPrimary }}>{d.name}</p>
                      <p className="text-[11px]" style={{ color: t.inkMuted }}>{d.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums" style={{ color: t.inkSecondary }}>{d.ip}</td>
                <td className="px-4 py-3">{pill(d)}</td>
                <td className="px-4 py-3 text-xs font-semibold tabular-nums" style={{ color: t.inkPrimary }}>
                  {d.rtt_ms != null ? d.rtt_ms : '—'}
                </td>
                <td className="px-4 py-3">
                  {d.online ? (
                    <Sparkline data={d.spark} color={t.series} surface={t.card} width={96} height={26} />
                  ) : (
                    <span className="text-[11px]" style={{ color: t.inkMuted }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums" style={{ color: t.inkSecondary }}>
                  {d.lastCheck ? d.lastCheck.toLocaleTimeString('fr-FR') : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs" style={{ color: t.inkMuted }}>
                  Aucun équipement ne correspond aux filtres
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
};

export default EquipmentTable;
