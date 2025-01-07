import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart, getCurrentWeek } from '@packages/dates/utils';
import { detectBalanceIssues } from '@packages/scoutgame/points/detectBalanceIssues';

export async function resolveBalanceIssues() {
  const balanceIssues = await detectBalanceIssues();

  for (let i = 0; i < balanceIssues.length; i++) {
    const balanceToResolve = balanceIssues[i];

    await prisma.builderEvent.create({
      data: {
        season: getCurrentSeasonStart(),
        type: 'misc_event',
        week: getCurrentWeek(),
        builder: {
          connect: {
            id: balanceToResolve.scoutId
          }
        },
        pointsReceipts: {
          create: {
            value: balanceToResolve.currentBalance - balanceToResolve.expectedBalance,
            recipientId: balanceToResolve.scoutId,
            claimedAt: new Date(),
            season: getCurrentSeasonStart()
          }
        }
      }
    });
  }
}
