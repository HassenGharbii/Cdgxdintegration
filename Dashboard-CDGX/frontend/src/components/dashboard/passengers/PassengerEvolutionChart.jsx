import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { baseApexOptions } from '../theme';

/**
 * Daily passenger flow: Montées / Descentes as columns (left axis, counts)
 * and Occupation (%) as a line on the right percentage axis — mirrors the
 * Cevidia overview layout. Bare chart: the parent card carries the title.
 */
const PassengerEvolutionChart = ({ evolution, t }) => {
  const base = baseApexOptions(t);
  const categories = evolution.map((d) =>
    d.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  );

  const options = {
    ...base,
    chart: { ...base.chart, type: 'line', stacked: false },
    colors: [t.series, t.series2, t.warning],
    stroke: { width: [0, 0, 2.5], curve: 'smooth', lineCap: 'round' },
    plotOptions: {
      bar: { columnWidth: '42%', borderRadius: 3, borderRadiusApplication: 'end' },
    },
    markers: { size: 0, strokeColors: t.card, strokeWidth: 2, hover: { size: 5 } },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      labels: { colors: t.inkSecondary },
      markers: { size: 5, offsetX: -2 },
      itemMargin: { horizontal: 8 },
    },
    xaxis: {
      categories,
      labels: { style: { colors: t.inkMuted, fontSize: '11px' } },
      axisBorder: { show: true, color: t.grid },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        seriesName: 'Montées',
        min: 0,
        tickAmount: 4,
        labels: {
          formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${Math.round(v)}`),
          style: { colors: t.inkMuted, fontSize: '11px' },
        },
      },
      { seriesName: 'Montées', show: false },
      {
        opposite: true,
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          formatter: (v) => `${Math.round(v)}%`,
          style: { colors: t.inkMuted, fontSize: '11px' },
        },
      },
    ],
    tooltip: {
      ...base.tooltip,
      shared: true,
      intersect: false,
      y: {
        formatter: (v, { seriesIndex }) =>
          seriesIndex === 2 ? `${Math.round(v)}%` : `${v.toLocaleString('fr-FR')} passagers`,
      },
    },
  };

  const series = [
    { name: 'Montées', type: 'column', data: evolution.map((d) => d.montees) },
    { name: 'Descentes', type: 'column', data: evolution.map((d) => d.descentes) },
    { name: 'Occupation (%)', type: 'line', data: evolution.map((d) => d.occupation) },
  ];

  return <ReactApexChart options={options} series={series} type="line" height={260} />;
};

export default PassengerEvolutionChart;
