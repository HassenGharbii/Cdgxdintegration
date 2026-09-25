import React from 'react';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import DashboardShell from '../../components/dashboard/DashboardShell';
import ComingSoon from '../../components/dashboard/ComingSoon';

const AnalyseCamera = () => (
  <DashboardShell title="Analyse par caméra" subtitle="Comptage passagers · détail par point de comptage">
    {(t) => (
      <ComingSoon
        t={t}
        icon={faCamera}
        title="Analyse par caméra"
        description="Cette vue permettra de suivre le comptage passagers caméra par caméra, avec l'historique et la fiabilité de chaque point de comptage."
      />
    )}
  </DashboardShell>
);

export default AnalyseCamera;
