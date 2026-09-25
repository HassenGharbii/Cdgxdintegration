import React from 'react';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import DashboardShell from '../../components/dashboard/DashboardShell';
import ComingSoon from '../../components/dashboard/ComingSoon';

const Evenements = () => (
  <DashboardShell title="Événements" subtitle="Comptage passagers · alertes et anomalies">
    {(t) => (
      <ComingSoon
        t={t}
        icon={faTriangleExclamation}
        title="Événements"
        description="Cette vue listera les événements liés au comptage passagers : anomalies de capteur, pics de fréquentation, seuils dépassés."
      />
    )}
  </DashboardShell>
);

export default Evenements;
