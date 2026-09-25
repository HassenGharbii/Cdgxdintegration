import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import ChartCard from './ChartCard';
import { baseApexOptions } from './theme';
import { API_URL } from '../../config';

// Ranges supported by the backend history endpoints.
const RANGES = [
  { key: '1h', label: '1 h' },
  { key: '6h', label: '6 h' },
  { key: '24h', label: '24 h' },
];

const REFRESH_MS = 60_000;

/**
 * RTT-over-time area chart fed by the pinger backend: fleet average
 * (/history/all) or a single device (/history?ip=…). Filters (range +
 * equipment) sit in one row above the plot.
 */
const LatencyTimeline = ({ devices, t }) => {
  const [range, setRange] = useState('24h');
  const [deviceId, setDeviceId] = useState('all');
  const [data, setData] = useState([]);

  const device = deviceId === 'all' ? null : devices.find((d) => String(d.id) === deviceId);
  const deviceIp = device?.ip ?? null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const url = deviceIp
          ? `${API_URL}/api/cibest/history?ip=${encodeURIComponent(deviceIp)}&range=${range}`
          : `${API_URL}/api/cibest/history/all?range=${range}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success || cancelled) return;
        const points = deviceIp
          ? json.data.map((r) => ({
              x: new Date(r.timestamp).getTime(),
              y: r.reachable === 'true' && r.rtt_ms != null ? Number(r.rtt_ms) : null,
            }))
          : json.data.map((r) => ({
              x: new Date(r.bucket).getTime(),
              y: r.avg_rtt != null ? Number(r.avg_rtt) : null,
            }));
        setData(points);
      } catch {
        if (!cancelled) setData([]);
      }
    };

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [range, deviceIp]);

  const options = {
    ...baseApexOptions(t),
    chart: { ...baseApexOptions(t).chart, type: 'area' },
    colors: [t.series],
    stroke: { curve: 'smooth', width: 2, lineCap: 'round' },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 0, opacityFrom: 0.22, opacityTo: 0, stops: [0, 100] },
    },
    markers: { size: 0, strokeColors: t.card, strokeWidth: 2, hover: { size: 5 } },
    noData: {
      text: 'Aucune donnée disponible sur cette période',
      style: { color: t.inkMuted, fontSize: '12px' },
    },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, style: { colors: t.inkMuted, fontSize: '11px' } },
      axisBorder: { show: true, color: t.grid },
      axisTicks: { show: false },
      crosshairs: { show: true, stroke: { color: t.inkMuted, width: 1, dashArray: 0 } },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
      labels: { formatter: (v) => `${Math.round(v)}`, style: { colors: t.inkMuted, fontSize: '11px' } },
    },
    tooltip: {
      ...baseApexOptions(t).tooltip,
      x: { format: 'dd MMM · HH:mm' },
      y: { formatter: (v) => (v != null ? `${Number(v).toFixed(1)} ms` : '—') },
    },
  };

  const series = [{ name: device ? device.name : 'RTT moyen du parc', data }];

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={deviceId}
        onChange={(e) => setDeviceId(e.target.value)}
        className="h-8 rounded-lg border px-2 text-xs font-medium outline-none transition-colors"
        style={{ background: t.cardSoft, borderColor: t.border, color: t.inkSecondary }}
      >
        <option value="all">Tout le parc</option>
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <div className="flex rounded-lg border p-0.5" style={{ borderColor: t.border, background: t.cardSoft }}>
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150"
            style={
              range === r.key
                ? { background: t.series, color: '#ffffff' }
                : { color: t.inkMuted }
            }
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ChartCard
      title="Temps de réponse (ms)"
      subtitle={device ? `${device.name} · ${device.ip}` : 'Latence moyenne, tous équipements joignables'}
      action={filters}
      t={t}
      className="h-full"
    >
      <ReactApexChart options={options} series={series} type="area" height={300} />
    </ChartCard>
  );
};

export default LatencyTimeline;
