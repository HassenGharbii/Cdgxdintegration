import React from 'react';
import ReactApexChart from 'react-apexcharts';
import ChartCard from '../ChartCard';

/** Equipment status donut: online/offline split with the fleet total in the center. */
const EquipmentStatusCard = ({ total, online, offline, t }) => {
  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      foreColor: t.inkMuted,
    },
    labels: ['Online', 'Offline'],
    colors: [t.good, t.critical],
    stroke: { colors: [t.card], width: 3 },
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '76%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', color: t.inkMuted, offsetY: 18 },
            value: {
              show: true,
              fontSize: '26px',
              fontWeight: 700,
              color: t.inkPrimary,
              offsetY: -14,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '12px',
              color: t.inkMuted,
              formatter: () => `${total}`,
            },
          },
        },
      },
    },
    tooltip: {
      theme: t.dark ? 'dark' : 'light',
      y: { formatter: (v) => `${v} équipement${v > 1 ? 's' : ''}` },
    },
  };

  return (
    <ChartCard title="Statut des équipements" t={t} className="h-full">
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <ReactApexChart options={options} series={[online, offline]} type="donut" height={230} />
        <div className="flex items-center justify-center gap-4 pb-1 text-xs font-semibold">
          <span className="flex items-center gap-1.5" style={{ color: t.goodText }}>
            <span className="h-2 w-2 rounded-full" style={{ background: t.good }} />
            {online} Online
          </span>
          <span className="flex items-center gap-1.5" style={{ color: t.criticalText }}>
            <span className="h-2 w-2 rounded-full" style={{ background: t.critical }} />
            {offline} Offline
          </span>
        </div>
      </div>
    </ChartCard>
  );
};

export default EquipmentStatusCard;
