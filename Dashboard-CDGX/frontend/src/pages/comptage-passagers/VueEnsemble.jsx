import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faArrowRightToBracket,
  faArrowRightFromBracket,
  faVideo,
  faTrain,
  faPlay,
  faStop,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import { API_URL } from '../../config';
import DashboardShell from '../../components/dashboard/DashboardShell';
import ChartCard from '../../components/dashboard/ChartCard';
import StatTile from '../../components/dashboard/StatTile';

const INSTANCES_POLL_MS = 3000;
const TRAIN_POLL_MS = 2000;

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function callInstanceAction(id, action) {
  await fetch(`${API_URL}/api/comptage-passagers/instances/${id}/${action}`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

const InstanceRow = ({ inst, t, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const counting = inst.counting;

  const toggle = async () => {
    setBusy(true);
    try {
      await callInstanceAction(inst.id, counting ? 'stop' : 'start');
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-t" style={{ borderColor: t.border }}>
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2.5">
          <img
            src={`${API_URL}/api/comptage-passagers/instances/${inst.id}/stream`}
            alt=""
            className="h-9 w-14 rounded-lg object-cover"
            style={{ background: t.cardSoft }}
          />
          <span className="font-medium" style={{ color: t.inkPrimary }}>{inst.name}</span>
        </div>
      </td>
      <td className="py-2.5 pr-3" style={{ color: t.inkSecondary }}>{inst.status}</td>
      <td className="py-2.5 pr-3">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            background: counting ? 'rgba(31,157,85,0.15)' : t.seriesTrack,
            color: counting ? t.goodText : t.inkMuted,
          }}
        >
          {counting ? 'Comptage actif' : 'En pause'}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-right" style={{ color: t.inkPrimary }}>{inst.counts.in_count}</td>
      <td className="py-2.5 pr-3 text-right" style={{ color: t.inkPrimary }}>{inst.counts.out_count}</td>
      <td className="py-2.5 pr-3 text-right" style={{ color: t.inkPrimary }}>{inst.counts.current}</td>
      <td className="py-2.5 pr-3 text-right font-semibold" style={{ color: t.inkPrimary }}>{inst.counts.total}</td>
      <td className="py-2.5 text-right">
        <button
          onClick={toggle}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-opacity disabled:opacity-50"
          style={{
            background: counting ? 'rgba(192,57,43,0.12)' : 'rgba(47,111,237,0.12)',
            color: counting ? t.criticalText : t.series,
          }}
        >
          <FontAwesomeIcon icon={counting ? faStop : faPlay} className="text-[10px]" />
          {counting ? 'Stop' : 'Start'}
        </button>
      </td>
    </tr>
  );
};

const VueEnsemble = () => {
  const [instances, setInstances] = useState([]);
  const [trainState, setTrainState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const refreshInstances = async () => {
    try {
      const res = await fetch(`${API_URL}/api/comptage-passagers/instances`);
      const json = await res.json();
      if (json.success) {
        setInstances(json.data);
        setError(null);
      } else {
        setError(json.error);
      }
    } catch {
      setError('Service de comptage (tx2) injoignable');
    } finally {
      setLoaded(true);
    }
  };

  const refreshTrainState = async () => {
    try {
      const res = await fetch(`${API_URL}/api/comptage-passagers/train-state`);
      const json = await res.json();
      setTrainState(json.success ? json.data : null);
    } catch {
      setTrainState(null);
    }
  };

  useEffect(() => {
    refreshInstances();
    refreshTrainState();
    const i1 = setInterval(refreshInstances, INSTANCES_POLL_MS);
    const i2 = setInterval(refreshTrainState, TRAIN_POLL_MS);
    return () => {
      clearInterval(i1);
      clearInterval(i2);
    };
  }, []);

  const totals = instances.reduce(
    (acc, i) => ({
      in: acc.in + i.counts.in_count,
      out: acc.out + i.counts.out_count,
      total: acc.total + i.counts.total,
    }),
    { in: 0, out: 0, total: 0 }
  );
  const camerasOnline = instances.filter((i) => i.status === 'running').length;

  const countingShouldBeActive = trainState ? Boolean(trainState.in_station) && Boolean(trainState.cab_active) : null;

  return (
    <DashboardShell title="Vue d'ensemble" subtitle="Comptage passagers · synthèse globale">
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
              <p className="text-sm" style={{ color: t.inkMuted }}>Chargement du comptage…</p>
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-1 gap-4 fade-up sm:grid-cols-2 xl:grid-cols-4">
                <StatTile label="Total comptés" value={totals.total} icon={faUsers} t={t} />
                <StatTile label="Montées" value={totals.in} icon={faArrowRightToBracket} iconColor={t.goodText} t={t} />
                <StatTile label="Descentes" value={totals.out} icon={faArrowRightFromBracket} t={t} />
                <StatTile
                  label="Caméras actives"
                  value={camerasOnline}
                  unit={`/ ${instances.length}`}
                  icon={faVideo}
                  t={t}
                />
              </div>

              {/* Train state banner — FR-001: counting active iff in_station && cab_active */}
              <ChartCard
                title="État train"
                subtitle="Source : bridge.py — TCMS (vitesse/cabine) + AVMS (position/trajet)"
                t={t}
                className="fade-up-1"
              >
                {!trainState ? (
                  <p className="text-sm" style={{ color: t.inkMuted }}>
                    Aucune donnée train reçue pour l'instant.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: countingShouldBeActive ? 'rgba(31,157,85,0.15)' : 'rgba(192,57,43,0.15)',
                        color: countingShouldBeActive ? t.goodText : t.criticalText,
                      }}
                    >
                      <FontAwesomeIcon icon={faTrain} />
                      Comptage {countingShouldBeActive ? 'ACTIF' : 'inactif'} (règle FR-001)
                    </span>
                    <span className="text-sm" style={{ color: t.inkSecondary }}>
                      Station : <strong style={{ color: t.inkPrimary }}>{trainState.station_label ?? '—'}</strong>
                    </span>
                    <span className="text-sm" style={{ color: t.inkSecondary }}>
                      Destination : <strong style={{ color: t.inkPrimary }}>{trainState.destination_label ?? '—'}</strong>
                    </span>
                    <span className="text-sm" style={{ color: t.inkSecondary }}>
                      Vitesse : <strong style={{ color: t.inkPrimary }}>{trainState.speed_kmh != null ? `${Number(trainState.speed_kmh).toFixed(1)} km/h` : '—'}</strong>
                    </span>
                    <span className="text-sm" style={{ color: t.inkSecondary }}>
                      Cabine active : <strong style={{ color: t.inkPrimary }}>{trainState.cab_active ? trainState.active_cab_id : 'non'}</strong>
                    </span>
                  </div>
                )}
              </ChartCard>

              {/* Instances table */}
              <ChartCard title="Points de comptage" subtitle="Une ligne par caméra (instance tx2)" t={t} className="fade-up-2">
                {instances.length === 0 ? (
                  <p className="text-sm" style={{ color: t.inkMuted }}>
                    Aucune instance de comptage créée sur tx2 pour l'instant.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: t.inkMuted }}>
                          <th className="pb-2 pr-3">Caméra</th>
                          <th className="pb-2 pr-3">Statut</th>
                          <th className="pb-2 pr-3">Comptage</th>
                          <th className="pb-2 pr-3 text-right">In</th>
                          <th className="pb-2 pr-3 text-right">Out</th>
                          <th className="pb-2 pr-3 text-right">Présents</th>
                          <th className="pb-2 pr-3 text-right">Total</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instances.map((inst) => (
                          <InstanceRow key={inst.id} inst={inst} t={t} onChanged={refreshInstances} />
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

export default VueEnsemble;
