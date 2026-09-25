import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

const Header = ({ title, icon, darkMode, onDarkModeToggle }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gaP-2">
        {icon && <FontAwesomeIcon icon={icon} className={`text-xl ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />}
        <h1 className={`text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</h1>
      </div>
      
      {onDarkModeToggle && (
        <button 
          onClick={onDarkModeToggle}
          className={`p-1 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
          aria-label="Toggle dark mode"
        >
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
        </button>
      )}
    </div>
  );
};

export default Header;