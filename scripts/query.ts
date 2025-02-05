import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentSeasonStart, getLastWeek } from '@packages/dates/utils';
import { prettyPrint } from '@packages/utils/strings';
import { optimism } from 'viem/chains';

async function query() {
  const scout = await prisma.partnerRewardPayoutContract.create({
    data: {
      chainId: optimism.id,
      contractAddress: '0x0000000000000000000000000000000000000000',
      season: getCurrentSeasonStart(),
      week: getLastWeek(),
      tokenAddress: '0x4200000000000000000000000000000000000042',
      partner: 'optimism_top_referrer',
      deployTxHash: '0x0000000000000000000000000000000000000000',
      tokenDecimals: 18,
      rewardPayouts: {
        createMany: {
          data: [
            {
              meta: {
                date: new Date()
              },
              amount: 25,
              userId: '3c16d32c-389b-49ea-b6db-aa2db5186988'
            }
          ]
        }
      }
    }
  });
  prettyPrint(scout);
}

query();
