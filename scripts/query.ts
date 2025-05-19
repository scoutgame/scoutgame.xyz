import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';
console.log('Current week:', getCurrentWeek());
import { getMatchupRewards } from '@packages/matchup/getMatchupRewards';
async function query() {
  // const matchups = await prisma.partnerRewardPayoutContract.findMany({
  //   where: {
  //     partner: 'matchup_pool_rewards'
  //   }
  // });
  // prettyPrint(matchups);

  const { tokenWinners, freeMatchupWinners } = await getMatchupRewards('2025-W20');
  console.log('Token winners:', tokenWinners);
  console.log('Free matchup winners:', freeMatchupWinners);
  for (const winner of freeMatchupWinners) {
    await prisma.scoutMatchup.create({
      data: {
        createdBy: winner.scoutId,
        week: '2025-W21',
        freeRegistration: true
      }
    });
  }
  const matchups = await prisma.scoutMatchup.findMany({
    where: {
      week: '2025-W21'
    }
  });
  prettyPrint(matchups);
}
query();
