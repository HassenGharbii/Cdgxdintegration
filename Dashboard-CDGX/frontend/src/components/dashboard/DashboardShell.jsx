import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTokens } from './theme';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/** Shared page shell (sidebar + topbar + theme state) for dashboard views. */
const DashboardShell = ({ title, subtitle, children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('cibestDarkMode');
    return stored === null ? true : stored === 'true';
  });
  useEffect(() => {
    localStorage.setItem('cibestDarkMode', darkMode);
  }, [darkMode]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('cibestSidebar') === 'collapsed'
  );
  useEffect(() => {
    localStorage.setItem('cibestSidebar', sidebarCollapsed ? 'collapsed' : 'open');
  }, [sidebarCollapsed]);

  const t = getTokens(darkMode);

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ background: t.page }}>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background: darkMode
            ? 'radial-gradient(640px circle at 15% -10%, rgba(59,130,246,0.16), transparent 60%), radial-gradient(900px circle at 90% -5%, rgba(99,102,241,0.10), transparent 55%)'
            : 'radial-gradient(640px circle at 15% -10%, rgba(59,130,246,0.08), transparent 60%)',
        }}
      />

      <Sidebar
        t={t}
        dark={darkMode}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          t={t}
          dark={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          title={title}
          subtitle={subtitle}
          isAdmin={user?.role === 'admin'}
          onAdmin={() => navigate('/admin')}
        />

        <main className="relative flex w-full flex-col gap-4 px-3 py-4 sm:px-4">
          {typeof children === 'function' ? children(t) : children}
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
