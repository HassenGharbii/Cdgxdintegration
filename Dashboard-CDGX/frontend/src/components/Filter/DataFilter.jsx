import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faSearch } from '@fortawesome/free-solid-svg-icons';

const DataFilter = ({ filters, onFilterChange, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  
  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: value
    };
    
    if (!value) {
      delete newFilters[filterKey];
    }
    
    setActiveFilters(newFilters);
    onFilterChange(newFilters, searchTerm);
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onFilterChange(activeFilters, e.target.value);
  };
  
  return (
    <div className={`p-4 rounded-xs shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-6`}>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className={`flex items-center px-3 py-2 rounded-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FontAwesomeIcon icon={faSearch} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              className={`ml-2 w-full outline-none ${darkMode ? 'bg-gray-700 text-slate-200 ' : 'bg-gray-100 text-gray-800'}`}
            />
          </div>
        </div>
        
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[150px]">
            <label className="block text-sm mb-1">{filter.label}</label>
            <select
              value={activeFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-slate-200 ' : 'bg-white text-gray-800'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}
            >
              <option value="">All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataFilter;