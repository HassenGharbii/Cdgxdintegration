import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faFire,
  faVideo,
  faCheck,
  faTriangleExclamation,
  faFilterCircleXmark,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';

import { API_URL } from '../config';
import DashboardShell from '../components/dashboard/DashboardShell';
import ChartCard from '../components/dashboard/ChartCard';
import StatTile from '../components/dashboard/StatTile';

const POLL_MS = 8000;

const EMPTY_FILTERS = { ip: '', camera: '', alarm_type: '', state: '', from: '', to: '' };

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const priorityColor = (t, priority) => {
  const p = (priority || '').toLowerCase();
  if (p.startsWith('crit')) return t.criticalText;
  if (p.startsWith('moy')) return t.warningText;
  return t.inkMuted;
};

const inputStyle = (t) => ({ borderColor: t.border, background: t.cardSoft, color: t.inkPrimary });

// Browsers render a <select>'s popup list themselves and mostly ignore the
// select's own background — only the <option>s' own colors reliably apply,
// so without this a dark theme's light text becomes white-on-white there.
const optionStyle = { color: '#111827', background: '#ffffff' };

const AlarmRow = ({ alarm, t, onAck }) => {
  const [busy, setBusy] = useState(false);
  const closed = alarm.state === 'Closed';
  const acked = alarm.state === 'Acknowledged';

  const ack = async () => {
    setBusy(true);
    try {
      await fetch(`${API_URL}/api/alarms/${alarm.id}/ack`, { method: 'POST', headers: authHeaders() });
      onAck();
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-t" style={{ borderColor: t.border }}>
      <td className="py-2.5 pr-3 font-mono text-xs" style={{ color: t.inkSecondary }}>{alarm.ip ?? '—'}</td>
      <td className="py-2.5 pr-3" style={{ color: t.inkPrimary }}>{alarm.camera_name ?? '—'}</td>
      <td className="py-2.5 pr-3" style={{ color: t.inkSecondary }}>{alarm.alarm_type ?? '—'}</td>
      <td className="py-2.5 pr-3" style={{ color: t.inkSecondary }}>{alarm.message ?? '—'}</td>
      <td className="py-2.5 pr-3 font-semibold" style={{ color: priorityColor(t, alarm.priority) }}>
        {alarm.priority || '—'}
      </td>
      <td className="py-2.5 pr-3">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            background: closed ? t.seriesTrack : acked ? 'rgba(47,111,237,0.12)' : 'rgba(192,57,43,0.15)',
            color: closed ? t.inkMuted : acked ? t.series : t.criticalText,
          }}
        >
          {alarm.state}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-xs" style={{ color: t.inkMuted }}>
        {new Date(alarm.triggered_at).toLocaleString()}
      </td>
      <td className="py-2.5 text-right">
        {!closed && !acked && (
          <button
            onClick={ack}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
            style={{ background: 'rgba(47,111,237,0.12)', color: t.series }}
          >
            <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
            Acquitter
          </button>
        )}
      </td>
    </tr>
  );
};

const Alarms = () => {
  const [alarms, setAlarms] = useState([]);
  const [summary, setSummary] = useState({ active: 0, critical: 0, cameras_affected: 0, last_24h: 0 });
  const [meta, setMeta] = useState({ alarm_types: [], states: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS); // bound to the inputs, edited freely
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS); // what's actually queried
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const filtersDirty = JSON.stringify(filters) !== JSON.stringify(appliedFilters);

  const refresh = async (activeFilters) => {
    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([k, v]) => { if (v) params.set(k, v); });

      const [alarmsRes, summaryRes, metaRes] = await Promise.all([
        fetch(`${API_URL}/api/alarms?${params.toString()}`),
        fetch(`${API_URL}/api/alarms/summary`),
        fetch(`${API_URL}/api/alarms/meta`),
      ]);
      const alarmsJson = await alarmsRes.json();
      const summaryJson = await summaryRes.json();
      const metaJson = await metaRes.json();
      if (!alarmsJson.success) throw new Error(alarmsJson.error);
      setAlarms(alarmsJson.data);
      if (summaryJson.success) setSummary(summaryJson.summary);
      if (metaJson.success) setMeta(metaJson);
      setError(null);
    } catch (err) {
      setError(err.message || "Impossible de joindre l'API");
    } finally {
      setLoaded(true);
    }
  };

  // Refetch only when filters are actually applied (button click), plus a
  // background poll on that same applied set so new alarms still show up
  // without wiping out whatever the user is mid-typing in the filter form.
  useEffect(() => {
    refresh(appliedFilters);
    const id = setInterval(() => refresh(appliedFilters), POLL_MS);
    return () => clearInterval(id);
  }, [appliedFilters]);

  const applyFilters = () => setAppliedFilters(filters);
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);

  return (
    <DashboardShell title="Alarmes" subtitle="Milestone XProtect · alarmes caméras par équipement">
      {(t) => (
        <>
          {error && (
            <div
              className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold"
              style={{ borderColor: t.critical, color: t.criticalText, background: t.cardSoft }}
            >
              <FontAwesomeIcon icon={faTriangleExclamation} />
              {error}
            </div>
          )}

          {!loaded ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: t.series, borderRightColor: t.series }} />
              <p className="text-sm" style={{ color: t.inkMuted }}>Chargement des alarmes…</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 fade-up sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Alarmes actives" value={summary.active} icon={faBell} iconColor={t.criticalText} t={t} />
                <StatTile label="Critiques" value={summary.critical} icon={faFire} iconColor={t.criticalText} t={t} />
                <StatTile label="Caméras concernées" value={summary.cameras_affected} icon={faVideo} t={t} />
                <StatTile label="Dernières 24h" value={summary.last_24h} icon={faTriangleExclamation} t={t} />
              </div>

              <ChartCard
                title="Filtres"
                subtitle="Combine IP, caméra, type, statut et période — s'applique à tout l'historique, pas seulement aujourd'hui"
                t={t}
                className="fade-up-1"
                action={
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: t.seriesTrack, color: t.inkSecondary }}
                      >
                        <FontAwesomeIcon icon={faFilterCircleXmark} className="text-[10px]" />
                        Réinitialiser
                      </button>
                    )}
                    <button
                      onClick={applyFilters}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold"
                      style={{ background: t.series, color: '#ffffff' }}
                    >
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[10px]" />
                      Appliquer
                    </button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <label className="flex flex-col gap-1 text-xs" style={{ color: t.inkMuted }}>
                    Adresse IP
                    <input
                      value={filters.ip}
                      onChange={setFilter('ip')}
                      onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                      placeholder="10.136.115.…"
                      className="rounded-lg border px-3 py-1.5 text-sm"
                      style={inputStyle(t)}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs" style={{ color: t.inkMuted }}>
                    Caméra
                    <input
                      value={filters.camera}
                      onChange={setFilter('camera')}
                      onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                      placeholder="Camera 05…"
                      className="rounded-lg border px-3 py-1.5 text-sm"
                      style={inputStyle(t)}
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs" style={{ color: t.inkMuted }}>
                    Type d'alarme
                    <select value={filters.alarm_type} onChange={setFilter('alarm_type')} className="rounded-lg border px-3 py-1.5 text-sm" style={inputStyle(t)}>
                      <option value="" style={optionStyle}>Tous</option>
                      {meta.alarm_types.map((type) => <option key={type} value={type} style={optionStyle}>{type}</option>)}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs" style={{ color: t.inkMuted }}>
                    Statut
                    <select value={filters.state} onChange={setFilter('state')} className="rounded-lg border px-3 py-1.5 text-sm" style={inputStyle(t)}>
                      <option value="" style={optionStyle}>Tous</option>
                      {meta.states.map((state) => <option key={state} value={state} style={optionStyle}>{state}</option>)}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs" style={{ color: t.inkMuted }}>
                    Du
                    <input type="datetime-local" value={filters.from} onChange={setFilter('from')} className="rounded-lg border px-3 py-1.5 text-sm" style={inputStyle(t)} />
                  </label>

                  <label className="flex flex-col gap-1 text-xs" style={{ color: t.inkMuted }}>
                    Au
                    <input type="datetime-local" value={filters.to} onChange={setFilter('to')} className="rounded-lg border px-3 py-1.5 text-sm" style={inputStyle(t)} />
                  </label>
                </div>
                {filtersDirty && (
                  <p className="mt-2 text-[11px]" style={{ color: t.warningText }}>
                    Filtres modifiés — cliquez sur "Appliquer" pour les prendre en compte.
                  </p>
                )}
              </ChartCard>

              <ChartCard
                title="Historique des alarmes"
                subtitle={`${alarms.length} résultat${alarms.length > 1 ? 's' : ''}`}
                t={t}
                className="fade-up-2"
              >
                {alarms.length === 0 ? (
                  <p className="text-sm" style={{ color: t.inkMuted }}>Aucune alarme pour ces filtres.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.inkMuted }}>
                          <th className="pb-2 pr-3">IP</th>
                          <th className="pb-2 pr-3">Caméra</th>
                          <th className="pb-2 pr-3">Type</th>
                          <th className="pb-2 pr-3">Message</th>
                          <th className="pb-2 pr-3">Priorité</th>
                          <th className="pb-2 pr-3">Statut</th>
                          <th className="pb-2 pr-3">Déclenchée</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alarms.map((alarm) => (
                          <AlarmRow key={alarm.id} alarm={alarm} t={t} onAck={() => refresh(appliedFilters)} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>
            </>
          )}
        </>
      )}
    </DashboardShell>
  );
};

export default Alarms;
