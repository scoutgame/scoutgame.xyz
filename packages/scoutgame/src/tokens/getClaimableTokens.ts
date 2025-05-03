import { prisma } from '@charmverse/core/prisma-client';
import { getPreviousSeason, getCurrentSeasonStart } from '@packages/dates/utils';
import { isTruthy } from '@packages/utils/types';
import { formatUnits } from 'viem';

export async function getClaimableTokens({
  userId,
  season = getCurrentSeasonStart(),
  week
}: {
  userId: string;
  season?: string;
  week?: string;
}): Promise<number> {
  const previousSeason = getPreviousSeason(season);
  const claimableSeasons = [previousSeason, season].filter(isTruthy);
  if (claimableSeasons.length === 0) {
    throw new Error(`No seasons found to claim points: ${season}`);
  }
  const tokensReceipts = await prisma.tokensReceipt.findMany({
    where: {
      recipientWallet: {
        scout: {
          id: userId
        }
      },
      claimedAt: null,
      event: {
        week,
        season: {
          in: claimableSeasons
        }
      }
    },
    select: {
      id: true,
      value: true,
      event: {
        select: {
          bonusPartner: true
        }
      }
    }
  });

  const totalUnclaimedTokens = tokensReceipts.reduce(
    (acc, receipt) => acc + Number(formatUnits(BigInt(receipt.value), 18)),
    0
  );

  return totalUnclaimedTokens;
}
