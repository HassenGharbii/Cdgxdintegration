import React from "react";
import ReactApexChart from "react-apexcharts";

const PieChart = ({ data }) => {
  // Transform the data from Chart.js format to ApexCharts format
  const series = data.datasets[0].data;
  const labels = data.labels;
  const colors = data.datasets[0].backgroundColor;

  const options = {
    chart: {
      type: 'pie',
      toolbar: {
        show: true
      }
    },
    labels: labels,
    colors: colors,
    legend: {
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    tooltip: {
      y: {
        formatter: function(value, { seriesIndex, dataPointIndex, w }) {
          const total = series.reduce((a, b) => a + b, 0);
          const percent = ((value / total) * 100).toFixed(1);
          return `${value} (${percent}%)`;
        }
      }
    }
  };

  return (
    <ReactApexChart 
      options={options} 
      series={series} 
      type="pie" 
      height="100%" 
    />
  );
};

export default PieChart;