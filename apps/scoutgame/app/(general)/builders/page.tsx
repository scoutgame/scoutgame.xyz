import { getCurrentWeek, validateISOWeek } from '@packages/scoutgame/dates/utils';
import { BuildersPage } from '@packages/scoutgame-ui/components/builders/BuildersPage';

export default async function Builders({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = (searchParams.tab as string) || 'leaderboard';
  const week = searchParams.week as string | undefined;
  const builderSort = (searchParams.builderSort as string | undefined) || 'rank';
  const builderOrder = (searchParams.builderOrder as string | undefined) || 'asc';

  return (
    <BuildersPage
      tab={tab}
      week={week && validateISOWeek(week) ? week : getCurrentWeek()}
      builderSort={builderSort}
      builderOrder={builderOrder}
    />
  );
}
