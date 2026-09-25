import React from 'react';

const LoadingScreen = ({ darkMode }) => (
  <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${darkMode ? 'bg-black' : 'bg-white bg-opacity-70'}`}>
    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
    <span className={`text-xl font-bold ${darkMode ? 'text-slate-200 ' : 'text-gray-800'}`}>Loading dashboard...</span>
  </div>
);

export default LoadingScreen;