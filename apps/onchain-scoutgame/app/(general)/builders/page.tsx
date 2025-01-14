import { getCurrentWeek, validateISOWeek } from '@packages/dates/utils';
import { getSession } from '@packages/nextjs/session/getSession';
import { BuildersPage } from '@packages/scoutgame-ui/components/builders/BuildersPage';

export default async function Builders({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = (searchParams.tab as string) || 'leaderboard';
  const week = searchParams.week as string | undefined;
  const session = await getSession();
  const userId = session.user?.id;
  return <BuildersPage tab={tab} week={week && validateISOWeek(week) ? week : getCurrentWeek()} userId={userId} />;
}
