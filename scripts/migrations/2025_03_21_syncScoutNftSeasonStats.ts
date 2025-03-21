import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { getCurrentSeasonStart } from '@packages/dates/utils';

async function syncScoutNftSeasonStats() {
  const scout = await prisma.scoutNft.findMany({
    where: {
      scoutWallet: {
        scout: {
          deletedAt: null
        }
      },
      builderNft: {
        season: getCurrentSeasonStart()
      }
    },
    select: {
      builderNft: {
        select: {
          builderId: true
        }
      },
      scoutWallet: {
        select: {
          scoutId: true
        }
      },
      balance: true,
    }
  });

  const scoutBalanceRecord: Record<string, {
    balance: number;
    scoutIds: string[];
  }> = {};

  scout.forEach((s) => {
    if (!scoutBalanceRecord[s.builderNft.builderId]) {
      scoutBalanceRecord[s.builderNft.builderId] = {
        balance: 0,
        scoutIds: []
      };
    }

    const scoutIds = scoutBalanceRecord[s.builderNft.builderId].scoutIds;
    scoutBalanceRecord[s.builderNft.builderId].balance += s.balance;
    scoutBalanceRecord[s.builderNft.builderId].scoutIds = Array.from(new Set([...scoutIds, s.scoutWallet.scoutId]));
  });

  for (const [builderId, { balance, scoutIds }] of Object.entries(scoutBalanceRecord)) {
    try {
      await prisma.userSeasonStats.update({
        where: {
          userId_season: {
            userId: builderId,
            season: getCurrentSeasonStart()
          }
        },
        data: {
          nftsSold: balance,
          nftOwners: scoutIds.length
        }
      });

      console.log(`Updated user season stats for builder ${builderId}`);
    } catch (error) {
      console.error(`Error updating user season stats for builder ${builderId}: ${error}`);
    }
  }
}

syncScoutNftSeasonStats();