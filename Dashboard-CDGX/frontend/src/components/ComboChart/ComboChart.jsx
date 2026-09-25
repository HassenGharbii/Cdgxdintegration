import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ComboChart = ({ categories, revenue, margin, darkMode = false, title, icon, height }) => {
  const options = {
    chart: {
      type: 'line',
      background: 'transparent',
      toolbar: {
        show: false
      },
    },
    stroke: {
      width: [0, 4],
      curve: 'smooth'
    },
    plotOptions: {
      bar: {
        columnWidth: '50%'
      }
    },
    colors: darkMode 
      ? ['#6366f1', '#f59e0b'] 
      : ['#6366f1', '#f59e0b'],
    dataLabels: {
      enabled: false,
    },
    labels: categories || [],
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: darkMode ? '#c7d2fe' : '#374151',
        }
      }
    },
    yaxis: [
      {
        title: {
          text: 'Revenue',
          style: {
            color: darkMode ? '#c7d2fe' : '#374151',
          }
        },
        labels: {
          style: {
            colors: darkMode ? '#c7d2fe' : '#374151',
          },
          formatter: function (val) {
            return '$' + val.toLocaleString();
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Profit Margin %',
          style: {
            color: darkMode ? '#c7d2fe' : '#374151',
          }
        },
        labels: {
          style: {
            colors: darkMode ? '#c7d2fe' : '#374151',
          },
          formatter: function (val) {
            return val.toFixed(1) + '%';
          }
        }
      }
    ],
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      y: {
        formatter: function(value, { seriesIndex }) {
          if (seriesIndex === 0) {
            return '$' + value.toLocaleString();
          } else {
            return value.toFixed(1) + '%';
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: darkMode ? '#c7d2fe' : '#374151'
      }
    }
  };

  const series = [
    {
      name: 'Revenue',
      type: 'column',
      data: revenue || []
    },
    {
      name: 'Profit Margin %',
      type: 'line',
      data: margin || []
    }
  ];

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
      <ReactApexChart options={options} series={series} type="line" height={height || 220} />
    </div>
  );
};

export default ComboChart;