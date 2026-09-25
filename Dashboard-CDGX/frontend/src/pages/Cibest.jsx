import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNetworkWired,
  faCircleCheck,
  faBolt,
  faSignal,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import { getTokens } from '../components/dashboard/theme';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import StatTile from '../components/dashboard/StatTile';
import LatencyTimeline from '../components/dashboard/LatencyTimeline';
import LatencyRanking from '../components/dashboard/LatencyRanking';
import Watchlist from '../components/dashboard/Watchlist';
import EquipmentTable from '../components/dashboard/EquipmentTable';
import DeviceDrawer from '../components/dashboard/DeviceDrawer';

const POLL_MS = 10_000;
const SPARK_LENGTH = 24;

/** ping_results has no type column — infer it from the equipment name. */
const inferType = (name = '') => {
  const n = name.toUpperCase();
  if (n.includes('CAM')) return 'Caméra';
  if (n.includes('NVR')) return 'NVR';
  if (n.includes('SRV') || n.includes('SERV')) return 'Serveur';
  if (n.includes('FW') || n.includes('FIREWALL') || n.includes('PARE')) return 'Pare-feu';
  if (n.includes('SW') || n.includes('SWITCH')) return 'Switch';
  if (n.includes('RTR') || n.includes('ROUT')) return 'Routeur';
  if (n.includes('WIFI') || n.includes('BORNE') || n.startsWith('AP')) return 'Borne Wi-Fi';
  return 'Équipement';
};

const Cibest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dark by default; the toggle is persisted across sessions.
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('cibestDarkMode');
    return stored === null ? true : stored === 'true';
  });
  useEffect(() => {
    localStorage.setItem('cibestDarkMode', darkMode);
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('cibestSidebar') === 'collapsed'
  );
  useEffect(() => {
    localStorage.setItem('cibestSidebar', sidebarCollapsed ? 'collapsed' : 'open');
  }, [sidebarCollapsed]);

  const t = getTokens(darkMode);

  // --- Live data from the pinger backend ---
  const [devices, setDevices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, online: 0, offline: 0, uptime: 0, avgRtt: null });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Rolling fleet-average RTT, feeds the KPI sparkline.
  const [avgSpark, setAvgSpark] = useState([]);
  // Per-device rolling RTT history + previous state (for transition events),
  // accumulated across polls.
  const sparkRef = useRef(new Map());
  const prevRef = useRef(new Map());

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [eqRes, stRes] = await Promise.all([
          fetch(`${API_URL}/api/cibest/equipements`),
          fetch(`${API_URL}/api/cibest/equipements/status`),
        ]);
        if (!eqRes.ok) throw new Error(`HTTP ${eqRes.status}`);
        const eqJson = await eqRes.json();
        if (!eqJson.success) throw new Error("Réponse API invalide");
        const stJson = stRes.ok ? await stRes.json() : null;
        if (cancelled) return;

        const now = new Date();
        const events = [];

        const mapped = eqJson.data.map((row) => {
          const online = row.reachable === 'true';
          const rtt = online && row.rtt_ms != null ? Math.round(Number(row.rtt_ms)) : null;

          const spark = sparkRef.current.get(row.ip) ?? [];
          spark.push(rtt);
          if (spark.length > SPARK_LENGTH) spark.shift();
          sparkRef.current.set(row.ip, spark);

          const prev = prevRef.current.get(row.ip);
          if (prev) {
            if (prev.online && !online) {
              events.push({ severity: 'critical', device: row.name, message: 'Équipement injoignable', at: now });
            } else if (!prev.online && online) {
              events.push({ severity: 'good', device: row.name, message: 'Connexion rétablie', at: now });
            }
            if (online && rtt > 80 && (prev.rtt ?? 0) <= 80) {
              events.push({ severity: 'warning', device: row.name, message: `Latence élevée (${rtt} ms)`, at: now });
            }
          }
          prevRef.current.set(row.ip, { online, rtt });

          return {
            id: row.id ?? row.ip,
            name: row.name,
            type: inferType(row.name),
            ip: row.ip,
            online,
            rtt_ms: rtt,
            ttl: row.ttl != null ? Number(row.ttl) : null,
            error: row.error || null,
            spark: [...spark],
            lastCheck: row.timestamp ? new Date(row.timestamp) : now,
          };
        });

        if (events.length) {
          setIncidents((cur) =>
            [...events.map((e, i) => ({ ...e, id: `${e.at.getTime()}-${i}` })), ...cur].slice(0, 30)
          );
        }

        const onlineCount = mapped.filter((d) => d.online).length;
        const rtts = mapped.filter((d) => d.rtt_ms != null).map((d) => d.rtt_ms);
        const avg = rtts.length ? rtts.reduce((a, b) => a + b, 0) / rtts.length : null;
        if (avg != null) {
          setAvgSpark((cur) => [...cur, Number(avg.toFixed(1))].slice(-SPARK_LENGTH));
        }

        setDevices(mapped);
        setSummary({
          total: stJson?.summary?.total_equipements ?? mapped.length,
          online: stJson?.summary?.online ?? onlineCount,
          offline: stJson?.summary?.offline ?? mapped.length - onlineCount,
          uptime: stJson?.summary?.uptime_percentage ??
            (mapped.length ? Math.round((onlineCount / mapped.length) * 10000) / 100 : 0),
          avgRtt: avg != null ? Number(avg.toFixed(1)) : null,
        });
        setLastUpdate(eqJson.timestamp ? new Date(eqJson.timestamp) : now);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const selected = devices.find((d) => d.id === selectedId) ?? null;

  // Trend of the fleet-average RTT over the sparkline window.
  const rttTrend = useMemo(() => {
    if (avgSpark.length < 6) return null;
    const half = Math.floor(avgSpark.length / 2);
    const before = avgSpark.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const after = avgSpark.slice(half).reduce((a, b) => a + b, 0) / (avgSpark.length - half);
    return before ? ((after - before) / before) * 100 : null;
  }, [avgSpark]);

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ background: t.page }}>
      {/* Soft ambient glow behind the content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: darkMode
            ? 'radial-gradient(640px circle at 15% -10%, rgba(59,130,246,0.16), transparent 60%), radial-gradient(900px circle at 90% -5%, rgba(99,102,241,0.10), transparent 55%)'
            : 'radial-gradient(640px circle at 15% -10%, rgba(59,130,246,0.08), transparent 60%)',
        }}
      />

      <Sidebar
        t={t}
        dark={darkMode}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          t={t}
          dark={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          lastUpdate={lastUpdate}
          isAdmin={user?.role === 'admin'}
          onAdmin={() => navigate('/admin')}
        />

        <main className="relative flex w-full flex-col gap-4 px-3 py-4 sm:px-4">
          {error && (
            <div
              className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold"
              style={{ borderColor: t.critical, color: t.criticalText, background: t.cardSoft }}
            >
              <FontAwesomeIcon icon={faTriangleExclamation} />
              Impossible de joindre l'API : {error}
            </div>
          )}

          {!loaded ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: t.series, borderRightColor: t.series }} />
              <p className="text-sm" style={{ color: t.inkMuted }}>
                Chargement des équipements…
              </p>
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-1 gap-4 fade-up sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Équipements supervisés"
                  value={summary.total}
                  icon={faNetworkWired}
                  note="ping toutes les 10 s"
                  t={t}
                />
                <StatTile
                  label="En ligne"
                  value={summary.online}
                  unit={`/ ${summary.total}`}
                  icon={faCircleCheck}
                  iconColor={t.goodText}
                  t={t}
                />
                <StatTile
                  label="Latence moyenne"
                  value={summary.avgRtt ?? '—'}
                  unit={summary.avgRtt != null ? 'ms' : undefined}
                  icon={faBolt}
                  delta={rttTrend != null ? `${Math.abs(rttTrend).toFixed(1)} %` : undefined}
                  deltaUp={rttTrend != null ? rttTrend >= 0 : undefined}
                  upIsGood={false}
                  spark={avgSpark.length > 1 ? avgSpark : undefined}
                  t={t}
                />
                <StatTile
                  label="Disponibilité"
                  value={summary.uptime}
                  unit="%"
                  icon={faSignal}
                  meter={summary.uptime}
                  t={t}
                />
              </div>

              {/* Timeline + watchlist */}
              <div className="grid grid-cols-1 gap-4 fade-up-1 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <LatencyTimeline devices={devices} t={t} />
                </div>
                <Watchlist devices={devices} t={t} onSelect={(d) => setSelectedId(d.id)} />
              </div>

              {/* Latency ranking */}
              <div className="fade-up-2">
                <LatencyRanking devices={devices} t={t} onSelect={(d) => setSelectedId(d.id)} />
              </div>

              {/* Fleet table */}
              <div className="fade-up-3">
                <EquipmentTable devices={devices} t={t} onSelect={(d) => setSelectedId(d.id)} />
              </div>
            </>
          )}

          <footer className="flex items-center justify-between pb-3 pt-1 text-[11px]" style={{ color: t.inkMuted }}>
            <span>CDGxpress · Supervision réseau</span>
            <span className="rounded-full border px-2.5 py-1" style={{ borderColor: t.border }}>
              Données temps réel — service pinger
            </span>
          </footer>
        </main>
      </div>

      {/* Device detail slide-over */}
      <DeviceDrawer device={selected} incidents={incidents} t={t} onClose={() => setSelectedId(null)} />
    </div>
  );
};

export default Cibest;
