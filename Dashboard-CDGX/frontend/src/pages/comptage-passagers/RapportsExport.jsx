import React from 'react';
import { faFileExport } from '@fortawesome/free-solid-svg-icons';
import DashboardShell from '../../components/dashboard/DashboardShell';
import ComingSoon from '../../components/dashboard/ComingSoon';

const RapportsExport = () => (
  <DashboardShell title="Rapports & export" subtitle="Comptage passagers · export des données">
    {(t) => (
      <ComingSoon
        t={t}
        icon={faFileExport}
        title="Rapports & export"
        description="Cette vue permettra de générer des rapports de fréquentation et d'exporter les données de comptage passagers (CSV, PDF)."
      />
    )}
  </DashboardShell>
);

export default RapportsExport;
