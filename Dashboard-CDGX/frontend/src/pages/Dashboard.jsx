import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  faNetworkWired,
  faCircleCheck,
  faCircleXmark,
  faSignal,
} from '@fortawesome/free-solid-svg-icons';

import DashboardShell from '../components/dashboard/DashboardShell';
import StatTile from '../components/dashboard/StatTile';
import PassengerOverviewCard from '../components/dashboard/passengers/PassengerOverviewCard';
import EquipmentStatusCard from '../components/dashboard/passengers/EquipmentStatusCard';
import VoitureTable from '../components/dashboard/passengers/VoitureTable';
import CameraRttChart from '../components/dashboard/passengers/CameraRttChart';
import TopCamerasTable from '../components/dashboard/passengers/TopCamerasTable';
import { generatePassengerOverview } from '../mock/mockPassengerData';
import { generateEquipements, computeSummary } from '../mock/mockData';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data] = useState(() => generatePassengerOverview());
  const [fleet] = useState(() => computeSummary(generateEquipements()));
  const { kpis, evolution, voitures, cameras } = data;

  return (
    <DashboardShell title="Dashboard" subtitle="Vue globale · équipements & comptage passagers">
      {(t) => (
        <>
          {/* KPI row — equipment fleet, same tiles as the Équipements dashboard */}
          <div className="grid grid-cols-1 gap-4 fade-up sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Total équipements" value={fleet.total} icon={faNetworkWired} t={t} />
            <StatTile
              label="Online équipements"
              value={fleet.online}
              icon={faCircleCheck}
              iconColor={t.goodText}
              t={t}
            />
            <StatTile
              label="Offline équipements"
              value={fleet.offline}
              icon={faCircleXmark}
              iconColor={t.criticalText}
              t={t}
            />
            <StatTile label="Uptime % moyen" value={fleet.uptime} unit="%" icon={faSignal} meter={fleet.uptime} t={t} />
          </div>

          {/* Two-column body: passengers overview + RTT (left) · status/voitures/top caméras (right) */}
          <div className="grid grid-cols-1 items-start gap-4 fade-up-1 xl:grid-cols-2">
            <div className="flex flex-col gap-4">
              <PassengerOverviewCard kpis={kpis} evolution={evolution} t={t} />
              <CameraRttChart cameras={cameras} t={t} />
            </div>

            <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <EquipmentStatusCard total={fleet.total} online={fleet.online} offline={fleet.offline} t={t} />
              </div>
              <div className="sm:col-span-3">
                <VoitureTable voitures={voitures} t={t} onSeeAll={() => navigate('/comptage-passagers/groupes')} />
              </div>
              <div className="sm:col-span-5">
                <TopCamerasTable
                  cameras={cameras}
                  t={t}
                  onSeeAll={() => navigate('/comptage-passagers/analyse-camera')}
                />
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between pb-3 pt-1 text-[11px]" style={{ color: t.inkMuted }}>
            <span>CDGxpress · Dashboard général</span>
            <span className="rounded-full border px-2.5 py-1" style={{ borderColor: t.border }}>
              Mode démo — données simulées
            </span>
          </footer>
        </>
      )}
    </DashboardShell>
  );
};

export default Dashboard;
