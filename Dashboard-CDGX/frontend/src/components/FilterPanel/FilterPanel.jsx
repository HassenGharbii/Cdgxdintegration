import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faDownload, faSearch } from '@fortawesome/free-solid-svg-icons';

const FilterPanel = ({
  filters,
  onFilterChange,
  onSearch,
  onExport,
  darkMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: value
    };
    
    if (!value) {
      delete newFilters[filterKey];
    }
    
    setActiveFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className={`mb-2 rounded-lg shadow-sm border transition-all duration-300 ${
      darkMode ? 'bg-black backdrop-blur-md border-[#120E0E] text-slate-200 ' : 'bg-white border border-gray-200 text-gray-900'
    }`}>
      <div className="p-1.5 flex items-center justify-between flex-wrap gap-1">
        {/* Search input */}
        <div className="flex-grow max-w-xs">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`text-sm px-3 py-1.5 rounded-l-md border-r-0 focus:outline-none w-full ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
              }`}
            />
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-r-md ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </form>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onExport && onExport('csv')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium shadow-sm transition ${
              darkMode ? 'bg-indigo-700 hover:bg-indigo-600 text-slate-200 ' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
            }`}
            title="Export as CSV"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-1" />
            Export
          </button>
          {filters.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium shadow-sm transition ${
                darkMode
                  ? `${isExpanded ? 'bg-indigo-600' : 'bg-gray-700'} hover:bg-indigo-700`
                  : `${isExpanded ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100'} hover:bg-indigo-200`
              }`}
              title="Toggle filters"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-1" />
              {isExpanded ? 'Hide' : 'Filters'}
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && filters.length > 0 && (
        <div className={`p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {filters.map((filter) => (
            <div key={filter.key} className="flex flex-col">
              <label className="block text-xs font-medium mb-0.5">{filter.label}</label>
              <select
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className={`w-full p-1 text-sm rounded border focus:outline-none ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-white border-gray-300'
                }`}
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
      )}
    </div>
  );
};

export default FilterPanel;