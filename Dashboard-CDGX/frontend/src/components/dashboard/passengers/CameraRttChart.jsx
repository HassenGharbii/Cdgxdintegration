import React from 'react';
import ReactApexChart from 'react-apexcharts';
import ChartCard from '../ChartCard';
import { baseApexOptions } from '../theme';

/** RTT per door camera — one series, one hue (identity is carried by the title). */
const CameraRttChart = ({ cameras, t }) => {
  const ordered = [...cameras].sort((a, b) => a.id - b.id);

  const options = {
    ...baseApexOptions(t),
    chart: { ...baseApexOptions(t).chart, type: 'bar' },
    colors: [t.series],
    plotOptions: {
      bar: { columnWidth: '45%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    xaxis: {
      categories: ordered.map((c) => c.name),
      labels: { style: { colors: t.inkMuted, fontSize: '11px' } },
      axisBorder: { show: true, color: t.grid },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
      labels: { formatter: (v) => `${Math.round(v)}`, style: { colors: t.inkMuted, fontSize: '11px' } },
    },
    tooltip: {
      ...baseApexOptions(t).tooltip,
      y: { formatter: (v) => `${v} ms` },
    },
  };

  const series = [{ name: 'RTT', data: ordered.map((c) => c.rtt) }];

  return (
    <ChartCard
      title="Temps de réponse (RTT) — Top 10 équipements"
      subtitle="Caméras de comptage passagers — portes"
      t={t}
      className="h-full"
    >
      <ReactApexChart options={options} series={series} type="bar" height={280} />
    </ChartCard>
  );
};

export default CameraRttChart;
