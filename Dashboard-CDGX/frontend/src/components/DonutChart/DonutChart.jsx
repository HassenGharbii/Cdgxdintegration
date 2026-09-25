import React, { useRef, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DonutChart = ({ data, labels, colors, darkMode, title, icon, format = "number" }) => {
  // Create options object for ApexCharts
  const options = {
    chart: {
      type: 'donut',
      background: 'transparent'
    },
    labels: labels || [],
    legend: {
      position: 'bottom',
      fontSize: '15px',
      fontWeight: 500,
      labels: { colors: darkMode ? '#c7d2fe' : '#374151', useSeriesColors: false }
    },
    dataLabels: {
      enabled: false,
      formatter: (val, opts) => {
        return `${opts.w.globals.series[opts.seriesIndex].toLocaleString('en-US', { maximumFractionDigits: 2 })}`
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: { show: false }
        }
      }
    },
    colors: colors || (darkMode
      ? ['#6366f1', '#818cf8', '#a5b4fc', '#fbbf24', '#f472b6']
      : ['#6366f1', '#818cf8', '#a5b4fc', '#fbbf24', '#f472b6']),
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      y: { formatter: val => `${val.toLocaleString()}` }
    }
  };
  
  return (
    <div className={`p-7 rounded-xl shadow-xl border
      ${darkMode
        ? 'bg-black backdrop-blur-md border-[#120E0E] text-slate-200 '
        : 'bg-white border border-gray-200 text-gray-900'}
      hover:shadow-xl transition-all duration-300 h-full`}
    >
      {/* Chart header */}
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-dashed" style={{borderColor: darkMode ? '#35365a' : '#e5e7eb'}}>
        <h1 className="text-2xs font-bold font-sans tracking-tight">{title}</h1>
      </div>
      <ReactApexChart options={options} series={data || []} type="donut" height={220} />
    </div>
  );
};

export default DonutChart;