import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

const DateRangeSelector = () => {
  const { dateRange, setDateRange, darkMode } = useDashboard();
  
  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', days: 'month' },
    { label: 'Last month', days: 'lastMonth' }
  ];
  
  const handlePresetClick = (preset) => {
    const end = new Date();
    let start = new Date();
    
    if (preset.days === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset.days === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end = new Date(end.getFullYear(), end.getMonth(), 0);
    } else {
      start = new Date(end);
      start.setDate(end.getDate() - preset.days);
    }
    
    setDateRange({ start, end });
  };
  
  return (
    <div className={`p-4 rounded-xs shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset)}
            className={`px-3 py-1 rounded-md text-sm ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-slate-200 ' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      <div className="mt-4 flex gap-4">
        <div>
          <label className="block text-sm mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({
              ...dateRange,
              start: new Date(e.target.value)
            })}
            className={`p-2 rounded border ${
              darkMode ? 'bg-gray-700 border-gray-600 text-slate-200 ' : 'bg-white border-gray-300'
            }`}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => setDateRange({
              ...dateRange,
              end: new Date(e.target.value)
            })}
            className={`p-2 rounded border ${
              darkMode ? 'bg-gray-700 border-gray-600 text-slate-200 ' : 'bg-white border-gray-300'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;