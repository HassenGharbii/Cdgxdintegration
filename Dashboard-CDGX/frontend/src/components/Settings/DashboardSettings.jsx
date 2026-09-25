import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDashboard } from '../../context/DashboardContext';

const DashboardSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode, setDarkMode } = useDashboard();
  const [settings, setSettings] = useState({
    refreshInterval: 0,
    showAnimations: true,
    compactView: false
  });

  const handleChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 P-2 rounded-full shadow-md z-20 ${
          darkMode ? 'bg-gray-700 text-slate-200 ' : 'bg-white text-gray-800'
        }`}
      >
        <FontAwesomeIcon icon={faCog} className="text-xl" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className={`w-96 rounded-xs shadow-xl ${darkMode ? 'bg-gray-800 text-slate-200 ' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Dashboard Settings</h2>
              <button onClick={() => setIsOpen(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                    <input
                      type="checkbox"
                      className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-0 top-0 w-6 h-6 rounded-full transition-transform transform ${darkMode ? 'translate-x-6 bg-white' : 'bg-white'}`}></div>
                  </div>
                </label>
              </div>
              
              {/* More settings options */}
              <div>
                <label className="block mb-2">Auto Refresh (seconds)</label>
                <select 
                  value={settings.refreshInterval}
                  onChange={(e) => handleChange('refreshInterval', Number(e.target.value))}
                  className={`w-full p-2 rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
                >
                  <option value={0}>Off</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
              
              {/* More settings here */}
            </div>
            
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-slate-200  rounded hover:bg-indigo-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardSettings;