import { prisma } from '@charmverse/core/prisma-client';

import { getMatchupLeaderboard } from './getMatchupLeaderboard';

export async function saveMatchupResults(week: string) {
  // Get the leaderboard for the specified week
  const leaderboard = await getMatchupLeaderboard(week);

  // save the results
  for (const entry of leaderboard) {
    await prisma.scoutMatchup.update({
      where: {
        createdBy_week: {
          week,
          createdBy: entry.scout.id
        }
      },
      data: {
        rank: entry.rank,
        totalScore: entry.totalGemsCollected
      }
    });
  }
  return leaderboard;
}
