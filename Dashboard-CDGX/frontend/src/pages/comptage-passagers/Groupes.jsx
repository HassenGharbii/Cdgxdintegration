import React from 'react';
import { faCarSide } from '@fortawesome/free-solid-svg-icons';
import DashboardShell from '../../components/dashboard/DashboardShell';
import ComingSoon from '../../components/dashboard/ComingSoon';

const Groupes = () => (
  <DashboardShell title="Groupes (voitures)" subtitle="Comptage passagers · agrégation par voiture">
    {(t) => (
      <ComingSoon
        t={t}
        icon={faCarSide}
        title="Groupes de voitures"
        description="Cette vue regroupera le comptage passagers par voiture / rame, pour comparer la charge entre les différents groupes."
      />
    )}
  </DashboardShell>
);

export default Groupes;
