import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSatelliteDish,
  faHouse,
  faNetworkWired,
  faUsers,
  faGaugeHigh,
  faCamera,
  faCarSide,
  faTriangleExclamation,
  faFileExport,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';

const NAV_ITEMS = [
  // { key: 'dashboard', label: 'Dashboard', icon: faHouse, path: '/dashboard' },
  { key: 'equipements', label: 'Équipements', icon: faNetworkWired, path: '/cibest' },
  {
    key: 'comptage-passagers',
    label: 'Comptage passagers',
    icon: faUsers,
    children: [
      { key: 'vue-ensemble', label: "Vue d'ensemble", icon: faGaugeHigh, path: '/comptage-passagers/vue-ensemble' },
      { key: 'analyse-camera', label: 'Analyse par caméra', icon: faCamera, path: '/comptage-passagers/analyse-camera' },
      { key: 'groupes', label: 'Groupes (voitures)', icon: faCarSide, path: '/comptage-passagers/groupes' },
      { key: 'evenements', label: 'Événements', icon: faTriangleExclamation, path: '/comptage-passagers/evenements' },
      { key: 'rapports', label: 'Rapports & export', icon: faFileExport, path: '/comptage-passagers/rapports' },
    ],
  },
];

/** Collapsible navigation rail; top-level entries may expand into a submenu. */
const Sidebar = ({ t, dark, collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) =>
    item.path
      ? location.pathname === item.path
      : !!item.children?.some((child) => location.pathname === child.path);

  const [openKeys, setOpenKeys] = useState(() =>
    NAV_ITEMS.filter((item) => item.children && isActive(item)).map((item) => item.key)
  );

  const toggleOpen = (key) =>
    setOpenKeys((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const handleParentClick = (item) => {
    if (!item.children) {
      navigate(item.path);
      return;
    }
    if (collapsed) {
      navigate(item.children[0].path);
      return;
    }
    toggleOpen(item.key);
  };

  return (
  <aside
    className={`sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-56'
    }`}
    style={{
      background: dark ? 'rgba(10,15,28,0.85)' : 'rgba(255,255,255,0.85)',
      borderColor: t.border,
      backdropFilter: 'blur(12px)',
    }}
  >
    {/* Brand */}
    <div className={`flex h-16 items-center gap-3 border-b px-3 ${collapsed ? 'justify-center' : ''}`} style={{ borderColor: t.border }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
        <FontAwesomeIcon icon={faSatelliteDish} />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight" style={{ color: t.inkPrimary }}>
            CDGxpress
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-wider" style={{ color: t.inkMuted }}>
            Supervision
          </p>
        </div>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pt-3">
      {!collapsed && (
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: t.inkMuted }}>
          Menu
        </p>
      )}
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        const open = openKeys.includes(item.key);
        return (
          <div key={item.key}>
            <button
              type="button"
              title={collapsed ? item.label : undefined}
              onClick={() => handleParentClick(item)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
              style={{ background: active ? t.seriesTrack : 'transparent', color: t.inkPrimary }}
            >
              <FontAwesomeIcon icon={item.icon} className="text-sm" style={{ color: t.series }} />
              {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
              {!collapsed && item.children && (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  style={{ color: t.inkMuted }}
                />
              )}
            </button>

            {!collapsed && item.children && open && (
              <div className="mt-1 flex flex-col gap-0.5 pl-4">
                {item.children.map((child) => {
                  const childActive = location.pathname === child.path;
                  return (
                    <button
                      key={child.key}
                      type="button"
                      onClick={() => navigate(child.path)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors"
                      style={{
                        background: childActive ? t.seriesTrack : 'transparent',
                        color: childActive ? t.inkPrimary : t.inkSecondary,
                      }}
                    >
                      <FontAwesomeIcon icon={child.icon} className="text-xs" />
                      <span className="truncate">{child.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>

    {/* Collapse toggle */}
    <div className="border-t p-2" style={{ borderColor: t.border }}>
      <button
        onClick={onToggle}
        title={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors hover:opacity-75 ${
          collapsed ? 'justify-center' : ''
        }`}
        style={{ color: t.inkSecondary }}
      >
        <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} className="text-xs" />
        {!collapsed && <span>Réduire</span>}
      </button>
    </div>
  </aside>
  );
};

export default Sidebar;
