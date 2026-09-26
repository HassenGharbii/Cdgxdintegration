import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faFire,
  faVideo,
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import { API_URL } from '../config';
import DashboardShell from '../components/dashboard/DashboardShell';
import ChartCard from '../components/dashboard/ChartCard';
import StatTile from '../components/dashboard/StatTile';

const POLL_MS = 8000;

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
  const [ipFilter, setIpFilter] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      const [alarmsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/alarms`),
        fetch(`${API_URL}/api/alarms/summary`),
      ]);
      const alarmsJson = await alarmsRes.json();
      const summaryJson = await summaryRes.json();
      if (!alarmsJson.success) throw new Error(alarmsJson.error);
      setAlarms(alarmsJson.data);
      if (summaryJson.success) setSummary(summaryJson.summary);
      setError(null);
    } catch (err) {
      setError(err.message || 'Impossible de joindre l\'API');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(
    () => (ipFilter.trim() ? alarms.filter((a) => (a.ip || '').includes(ipFilter.trim())) : alarms),
    [alarms, ipFilter]
  );

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
                title="Historique des alarmes"
                subtitle="Par adresse IP — filtrez pour voir les alarmes d'une caméra précise"
                t={t}
                className="fade-up-1"
                action={
                  <input
                    value={ipFilter}
                    onChange={(e) => setIpFilter(e.target.value)}
                    placeholder="Filtrer par IP…"
                    className="rounded-lg border px-3 py-1.5 text-xs"
                    style={{ borderColor: t.border, background: t.cardSoft, color: t.inkPrimary }}
                  />
                }
              >
                {filtered.length === 0 ? (
                  <p className="text-sm" style={{ color: t.inkMuted }}>Aucune alarme.</p>
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
                        {filtered.map((alarm) => (
                          <AlarmRow key={alarm.id} alarm={alarm} t={t} onAck={refresh} />
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
