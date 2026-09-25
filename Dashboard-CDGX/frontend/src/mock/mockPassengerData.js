// ---------------------------------------------------------------------------
// Mock data service for the "Comptage passagers" dashboard — simulates the
// Cevidia RT server (in/out passenger counting per door camera) so the UI can
// run without any API. Swap for the real Cevidia feed once available.
// Train layout: N voitures (wagons), each with 2 door cameras (Porte 1/2).
// ---------------------------------------------------------------------------

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.round(rand(min, max));

const VOITURE_COUNT = 5;
const PORTES_PAR_VOITURE = 2;
const EVOLUTION_DAYS = 7;

const jitteredRtt = (base) => Math.max(1, Math.round(base * rand(0.85, 1.2) + rand(-1, 2)));

function buildCameraCatalog() {
  const cameras = [];
  let n = 1;
  for (let v = 1; v <= VOITURE_COUNT; v++) {
    for (let p = 1; p <= PORTES_PAR_VOITURE; p++) {
      cameras.push({
        id: n,
        name: `Caméra ${n}`,
        porte: `Porte ${p}`,
        voitureId: v,
        voiture: `Voiture ${v}`,
        baseRtt: randInt(15, 45),
      });
      n++;
    }
  }
  return cameras;
}

/** Split a total across N days using random weights (rounded, exact sum). */
function distributeAcrossDays(total, days) {
  const weights = Array.from({ length: days }, () => rand(0.7, 1.3));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const values = weights.map((w) => Math.round((w / weightSum) * total));
  const diff = total - values.reduce((a, b) => a + b, 0);
  values[values.length - 1] += diff;
  return values;
}

/** One demo snapshot: KPIs, 7-day evolution, per-voiture and per-caméra stats. */
export function generatePassengerOverview() {
  const cameras = buildCameraCatalog().map((cam) => {
    const montees = randInt(650, 1000);
    const descentes = randInt(600, montees);
    return {
      ...cam,
      montees,
      descentes,
      total: montees + descentes,
      occupationMoy: randInt(48, 72),
      online: Math.random() > 0.06,
      rtt: jitteredRtt(cam.baseRtt),
      uptime24h: Number(rand(96, 100).toFixed(1)),
    };
  });

  const voitures = Array.from({ length: VOITURE_COUNT }, (_, i) => {
    const id = i + 1;
    const cams = cameras.filter((c) => c.voitureId === id);
    const montees = cams.reduce((a, c) => a + c.montees, 0);
    const descentes = cams.reduce((a, c) => a + c.descentes, 0);
    return {
      id,
      name: `Voiture ${id}`,
      montees,
      descentes,
      occupationMoy: Math.round(cams.reduce((a, c) => a + c.occupationMoy, 0) / cams.length),
      camerasOnline: cams.filter((c) => c.online).length,
      camerasTotal: cams.length,
    };
  });

  const totalMontees = voitures.reduce((a, v) => a + v.montees, 0);
  const totalDescentes = voitures.reduce((a, v) => a + v.descentes, 0);
  const occupationMoy = Math.round(voitures.reduce((a, v) => a + v.occupationMoy, 0) / voitures.length);

  const monteesParJour = distributeAcrossDays(totalMontees, EVOLUTION_DAYS);
  const descentesParJour = distributeAcrossDays(totalDescentes, EVOLUTION_DAYS);
  const today = new Date();
  const maxJour = Math.max(...monteesParJour);
  const evolution = Array.from({ length: EVOLUTION_DAYS }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (EVOLUTION_DAYS - 1 - i));
    return {
      date,
      montees: monteesParJour[i],
      descentes: descentesParJour[i],
      // daily occupancy tracks traffic volume, clamped to a plausible band
      occupation: Math.min(92, Math.round(35 + (monteesParJour[i] / maxJour) * 45 + rand(-4, 4))),
    };
  });

  const camerasOnline = cameras.filter((c) => c.online).length;

  return {
    kpis: {
      totalPassagers: totalMontees + totalDescentes,
      montees: totalMontees,
      descentes: totalDescentes,
      occupationMoy,
      deltaTotal: Number(rand(8, 22).toFixed(1)),
      deltaMontees: Number(rand(8, 22).toFixed(1)),
      deltaDescentes: Number(rand(8, 22).toFixed(1)),
      deltaOccupation: randInt(2, 8),
    },
    equipements: {
      total: cameras.length,
      online: camerasOnline,
      offline: cameras.length - camerasOnline,
      uptimeMoy: Number((cameras.reduce((a, c) => a + c.uptime24h, 0) / cameras.length).toFixed(1)),
    },
    evolution,
    voitures,
    cameras: [...cameras].sort((a, b) => b.total - a.total),
  };
}
