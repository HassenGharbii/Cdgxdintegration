// ---------------------------------------------------------------------------
// Mock data service — simulates the pinger backend so the dashboard can run
// without any API. Produces an equipment fleet, live RTT jitter, latency
// history and an incident feed. Swap back to the real API by replacing the
// calls in Cibest.jsx. Field shape mirrors the real backend: name, ip,
// reachable, rtt_ms, ttl, timestamp.
// ---------------------------------------------------------------------------

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.round(rand(min, max));

// Fleet catalog: name, type, ip, nominal RTT (ms)
const CATALOG = [
  ['FW-PRINCIPAL', 'Pare-feu', '10.10.1.1', 1],
  ['SW-CORE-01', 'Switch', '10.10.1.2', 1],
  ['SW-CORE-02', 'Switch', '10.10.1.3', 2],
  ['SRV-SUPERVISION', 'Serveur', '10.10.1.10', 2],
  ['NVR-01', 'NVR', '10.10.1.20', 3],
  ['NVR-02', 'NVR', '10.10.1.21', 4],
  ['CAM-ENTREE-01', 'Caméra', '10.10.1.31', 8],
  ['CAM-ENTREE-02', 'Caméra', '10.10.1.32', 9],
  ['CAM-PARKING-01', 'Caméra', '10.10.1.33', 11],
  ['CAM-PARKING-02', 'Caméra', '10.10.1.34', 12],
  ['CAM-ACCUEIL', 'Caméra', '10.10.1.35', 7],
  ['CAM-QUAI-01', 'Caméra', '10.10.1.36', 18],
  ['CAM-QUAI-02', 'Caméra', '10.10.1.37', 19],
  ['CAM-STOCK-01', 'Caméra', '10.10.1.38', 22],
  ['CAM-STOCK-02', 'Caméra', '10.10.1.39', 24],
  ['CAM-COULOIR-01', 'Caméra', '10.10.1.40', 14],
  ['CAM-COULOIR-02', 'Caméra', '10.10.1.41', 15],
  ['CAM-GUICHET-01', 'Caméra', '10.10.1.42', 35],
  ['CAM-GUICHET-02', 'Caméra', '10.10.1.43', 96],
  ['CAM-EXTERIEUR-01', 'Caméra', '10.10.1.44', 28],
  ['CAM-EXTERIEUR-02', 'Caméra', '10.10.1.45', 30],
  ['RTR-AGENCE-01', 'Routeur', '10.10.2.1', 26],
  ['SW-AGENCE-01', 'Switch', '10.10.2.2', 24],
  ['AP-ACCUEIL', 'Borne Wi-Fi', '10.10.1.50', 4],
  ['AP-DEPOT', 'Borne Wi-Fi', '10.10.1.51', 15],
  ['AP-AGENCE', 'Borne Wi-Fi', '10.10.2.50', 30],
];

// Devices that start the session offline
const OFFLINE_AT_START = new Set(['CAM-STOCK-02', 'AP-DEPOT']);

const SPARK_LENGTH = 24;

const jitteredRtt = (base) =>
  Math.max(1, Math.round(base * rand(0.85, 1.2) + rand(-1, 2)));

/** Build the initial equipment snapshot. */
export function generateEquipements() {
  return CATALOG.map(([name, type, ip, baseRtt], i) => {
    const online = !OFFLINE_AT_START.has(name);
    const rtt = online ? jitteredRtt(baseRtt) : null;
    return {
      id: i + 1,
      name,
      type,
      ip,
      baseRtt,
      online,
      rtt_ms: rtt,
      ttl: online ? (type === 'Caméra' || type === 'NVR' ? 64 : 255) : null,
      uptime24h: online ? Number(rand(97.2, 100).toFixed(1)) : Number(rand(62, 91).toFixed(1)),
      // rolling RTT history that feeds the table sparklines
      spark: Array.from({ length: SPARK_LENGTH }, () => (online ? jitteredRtt(baseRtt) : null)),
      lastCheck: new Date(),
    };
  });
}

/**
 * Advance the simulation one step: jitter RTTs and occasionally flip a
 * device offline / back online. Returns the new fleet plus any events
 * generated during the tick (for the device event history).
 */
export function tickEquipements(devices) {
  const events = [];
  const next = devices.map((d) => {
    let { online } = d;

    if (online && Math.random() < 0.006) {
      online = false;
      events.push({ severity: 'critical', device: d.name, message: 'Équipement injoignable', at: new Date() });
    } else if (!online && Math.random() < 0.05) {
      online = true;
      events.push({ severity: 'good', device: d.name, message: 'Connexion rétablie', at: new Date() });
    }

    const rtt = online ? jitteredRtt(d.baseRtt) : null;
    if (online && rtt > 80 && (d.rtt_ms ?? 0) <= 80) {
      events.push({ severity: 'warning', device: d.name, message: `Latence élevée (${rtt} ms)`, at: new Date() });
    }

    return {
      ...d,
      online,
      rtt_ms: rtt,
      ttl: online ? d.ttl ?? 64 : null,
      spark: [...d.spark.slice(1), rtt],
      lastCheck: new Date(),
    };
  });
  return { devices: next, events };
}

/** Aggregate figures for the KPI row. */
export function computeSummary(devices) {
  const online = devices.filter((d) => d.online);
  const degraded = online.filter((d) => d.rtt_ms > 80);
  const rtts = online.map((d) => d.rtt_ms);
  const avgRtt = rtts.length ? rtts.reduce((a, b) => a + b, 0) / rtts.length : 0;
  const uptime = devices.reduce((a, d) => a + d.uptime24h, 0) / (devices.length || 1);
  return {
    total: devices.length,
    online: online.length,
    offline: devices.length - online.length,
    degraded: degraded.length,
    healthy: online.length - degraded.length,
    avgRtt: Number(avgRtt.toFixed(1)),
    uptime: Number(uptime.toFixed(1)),
  };
}

// --- Latency history -------------------------------------------------------

export const HISTORY_RANGES = [
  { key: '1h', label: '1 h', points: 60, stepMs: 60_000 },
  { key: '6h', label: '6 h', points: 72, stepMs: 5 * 60_000 },
  { key: '24h', label: '24 h', points: 96, stepMs: 15 * 60_000 },
  { key: '7j', label: '7 j', points: 168, stepMs: 60 * 60_000 },
];

/**
 * Synthesize an RTT time series ending now: nominal level + business-hours
 * wave + noise + occasional spikes. `device` = null means fleet average.
 */
export function generateHistory(rangeKey, device = null) {
  const range = HISTORY_RANGES.find((r) => r.key === rangeKey) ?? HISTORY_RANGES[2];
  const base = device ? device.baseRtt : 18;
  const now = Date.now();
  const data = [];

  for (let i = range.points - 1; i >= 0; i--) {
    const ts = now - i * range.stepMs;
    const hour = new Date(ts).getHours();
    // traffic is heavier 08:00 → 18:00
    const wave = hour >= 8 && hour <= 18 ? Math.sin(((hour - 8) / 10) * Math.PI) : 0;
    let value = base + wave * base * 0.45 + rand(-base * 0.08, base * 0.12);
    if (Math.random() < 0.025) value += rand(base * 0.8, base * 2.2); // spike
    data.push({ x: ts, y: Math.max(1, Math.round(value * 10) / 10) });
  }
  return data;
}

// --- Event history ----------------------------------------------------------

const SEED_INCIDENTS = [
  ['critical', 'CAM-STOCK-02', 'Équipement injoignable', 174],
  ['warning', 'CAM-GUICHET-02', 'Latence élevée (112 ms)', 133],
  ['critical', 'AP-DEPOT', 'Équipement injoignable', 96],
  ['good', 'RTR-AGENCE-01', 'Connexion rétablie', 82],
  ['warning', 'RTR-AGENCE-01', 'Latence élevée (94 ms)', 61],
  ['critical', 'RTR-AGENCE-01', 'Équipement injoignable', 47],
  ['good', 'CAM-QUAI-01', 'Connexion rétablie', 28],
  ['warning', 'SW-AGENCE-01', 'Perte de paquets (3 %)', 12],
];

/** Recent events (most recent first) — feeds the device detail panel. */
export function generateIncidents() {
  const now = Date.now();
  return SEED_INCIDENTS
    .map(([severity, device, message, minutesAgo], i) => ({
      id: `seed-${i}`,
      severity,
      device,
      message,
      at: new Date(now - minutesAgo * 60_000 - randInt(0, 40) * 1000),
    }))
    .sort((a, b) => b.at - a.at);
}
