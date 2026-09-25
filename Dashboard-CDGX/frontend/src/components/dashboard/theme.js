// Design tokens for the dashboard. Chart colors are validated for contrast
// and color-vision deficiency against both card surfaces (see README):
// status colors are always paired with an icon or a label — never color alone.

export const getTokens = (dark) =>
  dark
    ? {
        dark: true,
        page: '#070b14',
        card: '#0d1424',
        cardSoft: 'rgba(148,163,184,0.06)',
        border: 'rgba(148,163,184,0.12)',
        inkPrimary: '#f1f5f9',
        inkSecondary: '#94a3b8',
        inkMuted: '#64748b',
        grid: '#1b2537',
        series: '#3987e5', // primary data hue (validated on #0d1424)
        series2: '#199e70', // 2nd categorical slot (aqua) — multi-series charts only
        seriesTrack: 'rgba(57,135,229,0.16)',
        good: '#0ca30c',
        goodText: '#4ade80',
        warning: '#fab219',
        warningText: '#fbbf24',
        critical: '#d03b3b',
        criticalText: '#f87171',
      }
    : {
        dark: false,
        page: '#f4f5f8',
        card: '#ffffff',
        cardSoft: 'rgba(15,23,42,0.035)',
        border: 'rgba(15,23,42,0.08)',
        inkPrimary: '#0f172a',
        inkSecondary: '#475569',
        inkMuted: '#94a3b8',
        grid: '#eceef2',
        series: '#2a78d6', // primary data hue (validated on #ffffff)
        series2: '#1baf7a', // 2nd categorical slot (aqua) — multi-series charts only
        seriesTrack: 'rgba(42,120,214,0.14)',
        good: '#0ca30c',
        goodText: '#047857',
        warning: '#fab219',
        warningText: '#b45309',
        critical: '#d03b3b',
        criticalText: '#b91c1c',
      };

/** Shared ApexCharts base: recessive hairline grid, muted ink, no chrome. */
export const baseApexOptions = (t) => ({
  chart: {
    background: 'transparent',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    foreColor: t.inkMuted,
    animations: { enabled: true, speed: 500, dynamicAnimation: { speed: 350 } },
  },
  grid: {
    borderColor: t.grid,
    strokeDashArray: 0,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { left: 10, right: 10 },
  },
  dataLabels: { enabled: false },
  tooltip: { theme: t.dark ? 'dark' : 'light' },
});
