import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { getBuildersWeeklyGemsAverage } from '@packages/scoutgame/gems/getBuildersWeeklyGemsAverage';
import { loadBuildersUserKnows } from '@packages/scoutgame/social/loadBuildersUserKnows';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { BuildersYouKnowPage } from 'components/builders-you-know/BuildersYouKnowPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  other: {
    robots: 'noindex'
  },
  title: 'Builders you know'
};

export default async function BuildersYouKnow() {
  const user = await getUserFromSession();

  const redirectPath = '/scout';

  if (!user?.farcasterId) {
    redirect(redirectPath);
  }

  const data = await loadBuildersUserKnows({ fid: user.farcasterId });

  if (!data || (data.buildersFollowingUser.length === 0 && data.buildersUserFollows.length === 0)) {
    redirect(redirectPath);
  }

  const { averageGems } = await getBuildersWeeklyGemsAverage();

  // logic in middleware.ts ensures that user is logged in
  return (
    <BuildersYouKnowPage
      dailyAverageGems={averageGems}
      builders={data.buildersFollowingUser.concat(data.buildersUserFollows)}
    />
  );
}
