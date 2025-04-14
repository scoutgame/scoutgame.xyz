import { getCurrentWeek, getPreviousWeek, getCurrentSeasonWeekNumber } from '@packages/dates/utils';

import { ControlledTabs } from 'components/common/ControlledTabs';

import { MatchupWinnersTable } from './components/MatchupWinnersTable';
import { RegistrationsTable } from './components/RegistrationsTable';

export function RegistrationSidebar({ week, weekNumber }: { week: string; weekNumber: number }) {
  const lastWeek = getPreviousWeek(getCurrentWeek());
  const lastWeekNumber = getCurrentSeasonWeekNumber(lastWeek);
  return (
    <ControlledTabs
      tabs={[
        {
          view: 'registrations',
          component: <RegistrationsTable week={week} weekNumber={weekNumber} />,
          label: `Week ${weekNumber} Teams`
        },
        {
          hidden: weekNumber < 1,
          view: 'last_week_results',
          component: <MatchupWinnersTable week={lastWeek} weekNumber={lastWeekNumber} />,
          label: `Results`
        }
      ]}
      // fallback={<LoadingCards />}
    />
  );
}
