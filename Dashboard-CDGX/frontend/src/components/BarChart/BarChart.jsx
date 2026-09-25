import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BarChart = ({ data, labels, darkMode = false, title, height }) => {
  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 10,
        distributed: false
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: labels || [],
      labels: { style: { colors: darkMode ? '#e5e7eb' : '#4b5563', fontWeight: 600 } }
    },
    yaxis: {
      labels: { 
        style: { colors: darkMode ? '#e5e7eb' : '#4b5563', fontWeight: 600 },
        formatter: (value) => { 
          return value.toLocaleString('en-US', { maximumFractionDigits: 2 }) 
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.7,
        gradientToColors: darkMode ? ['#6366f1'] : ['#2563eb'],
        opacityFrom: 0.95,
        opacityTo: 0.85,
      }
    },
    colors: darkMode ? ['#818cf8'] : ['#3b82f6'],
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      y: { formatter: val => `${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}` }
    },
    grid: { borderColor: darkMode ? '#23243a' : '#e5e7eb' }
  };

  const series = [{ name: 'Revenue', data: data || [] }];

  return (
    <div className={`p-7 rounded-xl shadow-xl border
      ${darkMode
        ? 'bg-black backdrop-blur-md border-[#120E0E] text-slate-200'
        : 'bg-white border border-gray-200 text-gray-900'}
      hover:shadow-xl transition-all duration-300 h-full`}
    >
      <div className="flex items-center gaP-2 mb-6 pb-2 border-b border-dashed" style={{borderColor: darkMode ? '#35365a' : '#e5e7eb'}}>
        
        <h1 className="text-2xs font-bold font-sans tracking-tight">{title}</h1>
      </div>
      <ReactApexChart options={options} series={series} type="bar" height={height || 220} />
    </div>
  );
};

export default BarChart;