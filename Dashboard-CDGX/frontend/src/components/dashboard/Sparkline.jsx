import React, { useId } from 'react';

/**
 * Inline SVG sparkline: 2px line, ~10% area wash, end dot with a 2px
 * surface ring. Null points (offline) are skipped.
 */
const Sparkline = ({ data, color, surface, width = 120, height = 36 }) => {
  const gradientId = useId();
  const points = data.filter((v) => v != null);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (points.length - 1);
  const toY = (v) => pad + (height - pad * 2) * (1 - (v - min) / span);

  const coords = points.map((v, i) => [pad + i * stepX, toY(v)]);
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height - pad} L${pad},${height - pad} Z`;
  const [endX, endY] = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={endX} cy={endY} r="3.5" fill={color} stroke={surface} strokeWidth="2" />
    </svg>
  );
};

export default Sparkline;
