import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const KPI = ({ title, value, icon, darkMode }) => (
  <div className={`flex items-center p-2 rounded-lg shadow-md border
    ${darkMode
      ? 'bg-gradient-to-r from-[#000] to-[#141313] border-[#120E0E] text-slate-200 '
      : 'bg-white border-gray-200 text-gray-900'}
    transition-colors duration-200`}
  >
    <div className={`mr-3 p-2 rounded-lg ${darkMode ? 'bg-indigo-700/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
      <FontAwesomeIcon icon={icon} size="sm" />
    </div>
    <div className="flex flex-col">
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className={`text-xs font-medium ${darkMode ? 'text-indigo-200/70' : 'text-gray-500'}`}>{title}</div>
    </div>
  </div>
);

export default KPI;