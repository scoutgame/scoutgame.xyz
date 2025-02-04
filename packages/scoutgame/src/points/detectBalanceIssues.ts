import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';

import { getPointStatsFromHistory } from '../points/getPointStatsFromHistory';

export async function detectBalanceIssues() {
  const scouts = await prisma.scout.findMany({
    orderBy: {
      farcasterId: 'asc'
    },
    where: {
      deletedAt: null
    },
    select: {
      id: true,
      farcasterId: true,
      farcasterName: true
    }
  });
  const totalScouts = scouts.length;

  log.info(`Checking ${totalScouts} scouts for balance issues...`);

  const scoutsWithBalanceIssues = [];

  for (let i = 0; i < totalScouts; i++) {
    log.info(
      `Checking scout ${i + 1} of ${totalScouts}: fid=${scouts[i].farcasterId}, username=${scouts[i].farcasterName}`
    );
    const scout = scouts[i];

    const balances = await getPointStatsFromHistory({
      userIdOrPath: scout.id,
      season: getCurrentSeasonStart()
    });

    if (balances.balance !== balances.balanceOnScoutProfile) {
      log.error(
        `Scout (id: ${scout.id})  (fid:${scout.farcasterId}) has a balance discrepancy: ${balances.balance} (computed) vs ${balances.balanceOnScoutProfile} (current)`
      );
      scoutsWithBalanceIssues.push({
        farcasterId: scout.farcasterId,
        scoutId: scout.id,
        expectedBalance: balances.balance,
        currentBalance: balances.balanceOnScoutProfile,
        pointDetails: balances
      });
    }
  }

  return scoutsWithBalanceIssues;
}
