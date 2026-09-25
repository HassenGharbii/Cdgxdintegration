import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faDollarSign, faBullhorn, 
  faUsers, faTasks, faTruck
} from '@fortawesome/free-solid-svg-icons';
import { useDashboard } from '../../context/DashboardContext';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const { darkMode, setDarkMode } = useDashboard();
  
  const menuItems = [
    { path: '/dashboard/sales', name: 'Sales', icon: faChartLine },
    { path: '/dashboard/finance', name: 'Finance', icon: faDollarSign },
    { path: '/dashboard/marketing', name: 'Marketing', icon: faBullhorn },
    { path: '/dashboard/hr', name: 'HR', icon: faUsers },
    { path: '/dashboard/projects', name: 'Projects', icon: faTasks },
    { path: '/dashboard/logistics', name: 'Logistics', icon: faTruck },
  ];

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-slate-200 ' : 'bg-gray-100 text-gray-800'}`}>
      {/* Sidebar */}
      <div className={`w-64 h-screen fixed ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="p-4">
          <h1 className="text-xl font-bold mb-8">Dashboard Tool</h1>
          <nav>
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`flex items-center gaP-2 P-2 rounded-xs transition-colors ${
                      location.pathname === item.path 
                        ? darkMode ? 'bg-indigo-600 text-slate-200 ' : 'bg-indigo-100 text-indigo-800'
                        : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 ml-64">
        <header className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md flex justify-between items-center`}>
          <h2 className="text-md font-semibold">{menuItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
        <main className="p-6 overflow-auto" style={{ height: 'calc(100vh - 64px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;