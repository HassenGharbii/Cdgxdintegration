import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StackedBarChart = ({ series, categories, darkMode = false, title, height }) => {
  const options = {
    chart: {
      type: 'bar',
      stacked: true,
      background: 'transparent',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
      },
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: categories || [],
      labels: {
        style: {
          colors: darkMode ? '#c7d2fe' : '#374151',
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: darkMode ? '#c7d2fe' : '#374151',
        },
        formatter: function (val) {
          return '$' + val.toLocaleString();
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: darkMode ? '#c7d2fe' : '#374151'
      }
    },
    fill: {
      opacity: 1
    },
    colors: darkMode
      ? ['#3b82f6', '#60a5fa', '#93c5fd', '#f59e0b', '#ec4899', '#8b5cf6', '#34d399']
      : ['#3b82f6', '#60a5fa', '#93c5fd', '#f59e0b', '#ec4899', '#8b5cf6', '#34d399'],
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      y: {
        formatter: function (val) {
          return '$' + val.toLocaleString();
        }
      }
    },
    grid: {
      borderColor: darkMode ? '#374151' : '#e5e7eb',
    }
  };

  return (
    <div className={`p-7 rounded-xl shadow-xl border
      ${darkMode
        ? 'bg-black backdrop-blur-md border-[#120E0E] text-slate-200'
        : 'bg-white border border-gray-200 text-gray-900'}
      hover:shadow-xl transition-all duration-300 h-full`}
    >
      {/* Chart header */}
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-dashed" style={{borderColor: darkMode ? '#35365a' : '#e5e7eb'}}>
       
        <h1 className="text-2xs font-bold font-sans tracking-tight">{title}</h1>
      </div>
      <ReactApexChart options={options} series={series || []} type="bar" height={220} />
    </div>
  );
};

export default StackedBarChart;