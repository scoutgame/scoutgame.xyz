import { getCurrentWeek, validateISOWeek } from '@packages/dates/utils';
import { getCachedUserFromSession as getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { BuildersPage } from '@packages/scoutgame-ui/components/builders/BuildersPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developers'
};

export default async function Developers({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = (searchParams.tab as string) || 'leaderboard';
  const week = searchParams.week as string | undefined;
  const builderSort = (searchParams.builderSort as string | undefined) || 'rank';
  const builderOrder = (searchParams.builderOrder as string | undefined) || 'asc';
  const [, user] = await safeAwaitSSRData(getUserFromSession());

  return (
    <BuildersPage
      tab={tab}
      week={week && validateISOWeek(week) ? week : getCurrentWeek()}
      builderSort={builderSort}
      builderOrder={builderOrder}
      user={user}
    />
  );
}
