import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCircleCheck, faTriangleExclamation, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { baseApexOptions } from './theme';
import { TYPE_ICONS, FALLBACK_ICON } from './deviceIcons';
import { API_URL } from '../../config';
import Sparkline from './Sparkline';

const EVENT_ICONS = { good: faCircleCheck, warning: faTriangleExclamation, critical: faCircleXmark };

// Ranges supported by the backend history endpoint.
const RANGES = [
  { key: '1h', label: '1 h' },
  { key: '6h', label: '6 h' },
  { key: '24h', label: '24 h' },
];

const timeAgo = (date) => {
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  return `il y a ${Math.floor(mins / 60)} h ${mins % 60 ? `${mins % 60} min` : ''}`;
};

/**
 * Slide-over detail panel for one device: live status, RTT history with
 * range filter, last pings sparkline and the device's own event history.
 * Opens on click from the table / ranking; closes on ✕, backdrop or Échap.
 */
const DeviceDrawer = ({ device, incidents, t, onClose }) => {
  const [range, setRange] = useState('24h');
  const [rows, setRows] = useState([]);
  const deviceIp = device?.ip ?? null;

  useEffect(() => {
    if (!device) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [device, onClose]);

  // Real RTT history from the pinger backend.
  useEffect(() => {
    if (!deviceIp) return undefined;
    let cancelled = false;
    setRows([]);
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/cibest/history?ip=${encodeURIComponent(deviceIp)}&range=${range}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled && json.success) setRows(json.data);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceIp, range]);

  if (!device) return null;

  const history = rows.map((r) => ({
    x: new Date(r.timestamp).getTime(),
    y: r.reachable === 'true' && r.rtt_ms != null ? Number(r.rtt_ms) : null,
  }));
  const values = history.map((p) => p.y).filter((v) => v != null);
  const stats = values.length
    ? {
        min: Math.min(...values).toFixed(0),
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
        max: Math.max(...values).toFixed(0),
      }
    : { min: '—', avg: '—', max: '—' };
  const dispo = rows.length
    ? Math.round((rows.filter((r) => r.reachable === 'true').length / rows.length) * 1000) / 10
    : null;
  const events = incidents.filter((i) => i.device === device.name).slice(0, 8);
  const status = !device.online ? 'offline' : device.rtt_ms > 80 ? 'degraded' : 'online';
  const statusConf = {
    online: { color: t.good, text: t.goodText, label: 'En ligne' },
    degraded: { color: t.warning, text: t.warningText, label: 'Dégradé' },
    offline: { color: t.critical, text: t.criticalText, label: 'Hors ligne' },
  }[status];

  const chartOptions = {
    ...baseApexOptions(t),
    chart: { ...baseApexOptions(t).chart, type: 'area' },
    colors: [t.series],
    stroke: { curve: 'smooth', width: 2, lineCap: 'round' },
    fill: { type: 'gradient', gradient: { shadeIntensity: 0, opacityFrom: 0.22, opacityTo: 0, stops: [0, 100] } },
    markers: { size: 0, strokeColors: t.card, strokeWidth: 2, hover: { size: 5 } },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, style: { colors: t.inkMuted, fontSize: '10px' } },
      axisBorder: { show: true, color: t.grid },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
      labels: { formatter: (v) => `${Math.round(v)}`, style: { colors: t.inkMuted, fontSize: '10px' } },
    },
    grid: { ...baseApexOptions(t).grid, padding: { left: 4, right: 4 } },
    tooltip: {
      ...baseApexOptions(t).tooltip,
      x: { format: 'dd MMM · HH:mm' },
      y: { formatter: (v) => (v != null ? `${v.toFixed(1)} ms` : '—') },
    },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label={`Détails ${device.name}`}
        className="drawer-panel dashboard-scroll fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col gap-4 overflow-y-auto border-l p-5"
        style={{ background: t.card, borderColor: t.border }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base"
              style={{ background: t.cardSoft, color: t.series }}
            >
              <FontAwesomeIcon icon={TYPE_ICONS[device.type] ?? FALLBACK_ICON} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight" style={{ color: t.inkPrimary }}>
                {device.name}
              </h2>
              <p className="truncate text-xs" style={{ color: t.inkMuted }}>
                {device.type} · <span className="font-mono">{device.ip}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition hover:opacity-70"
            style={{ borderColor: t.border, color: t.inkSecondary }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Live status strip */}
        <div className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: t.border, background: t.cardSoft }}>
          <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: statusConf.text }}>
            <span className="relative flex h-2.5 w-2.5">
              {device.online && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: statusConf.color }} />
              )}
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: statusConf.color }} />
            </span>
            {statusConf.label}
          </span>
          <span className="text-xs" style={{ color: t.inkMuted }}>
            Dernier contrôle : {device.lastCheck.toLocaleTimeString('fr-FR')}
          </span>
        </div>

        {/* Key figures */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'RTT actuel', value: device.rtt_ms != null ? `${device.rtt_ms} ms` : '—' },
            { label: `Moy. ${range}`, value: stats.avg === '—' ? '—' : `${stats.avg} ms` },
            { label: `Dispo. ${range}`, value: dispo != null ? `${dispo} %` : '—' },
          ].map((f) => (
            <div key={f.label} className="rounded-xl border px-3 py-2.5" style={{ borderColor: t.border }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.inkMuted }}>
                {f.label}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: t.inkPrimary }}>
                {f.value}
              </p>
            </div>
          ))}
        </div>

        {/* RTT history */}
        <div className="rounded-xl border p-4" style={{ borderColor: t.border }}>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: t.inkPrimary }}>
                Historique RTT
              </h3>
              <p className="text-[11px]" style={{ color: t.inkMuted }}>
                min {stats.min} ms · max {stats.max} ms
              </p>
            </div>
            <div className="flex rounded-lg border p-0.5" style={{ borderColor: t.border, background: t.cardSoft }}>
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
                  style={range === r.key ? { background: t.series, color: '#fff' } : { color: t.inkMuted }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <ReactApexChart
            options={chartOptions}
            series={[{ name: device.name, data: history }]}
            type="area"
            height={200}
          />
        </div>

        {/* Live pings */}
        <div className="rounded-xl border p-4" style={{ borderColor: t.border }}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: t.inkPrimary }}>
              Derniers pings
            </h3>
            <span className="text-[11px]" style={{ color: t.inkMuted }}>
              mise à jour en direct
            </span>
          </div>
          {device.online ? (
            <Sparkline data={device.spark} color={t.series} surface={t.card} width={392} height={56} />
          ) : (
            <p className="py-3 text-center text-xs" style={{ color: t.inkMuted }}>
              Équipement injoignable — aucun ping
            </p>
          )}
        </div>

        {/* Device events */}
        <div className="rounded-xl border p-4" style={{ borderColor: t.border }}>
          <h3 className="mb-2 text-sm font-semibold" style={{ color: t.inkPrimary }}>
            Événements récents
          </h3>
          {events.length ? (
            <ul className="flex flex-col gap-1">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                  <FontAwesomeIcon
                    icon={EVENT_ICONS[e.severity]}
                    className="shrink-0 text-xs"
                    style={{ color: e.severity === 'good' ? t.good : e.severity === 'warning' ? t.warning : t.critical }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: t.inkSecondary }}>
                    {e.message}
                  </span>
                  <span className="shrink-0 text-[11px]" style={{ color: t.inkMuted }}>
                    {timeAgo(e.at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-2 text-xs" style={{ color: t.inkMuted }}>
              Aucun événement récent pour cet équipement
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default DeviceDrawer;
