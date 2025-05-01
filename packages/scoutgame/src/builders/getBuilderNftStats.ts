import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeason, getCurrentWeek } from '@packages/dates/utils';

import { validMintNftPurchaseEvent } from '../builderNfts/constants';
import { resolveTokenOwnershipForBuilder } from '../protocol/resolveTokenOwnershipForBuilder';

export type NftStats = {
  builderStrikes: number;
  nftSupply: { default: number; starterPack: number; total: number };
};

export async function getBuilderNftStats({
  builderId,
  week = getCurrentWeek()
}: {
  builderId: string;
  week?: string;
}): Promise<NftStats> {
  const season = getCurrentSeason(week).start;
  const [, builderStrikes] = await Promise.all([
    prisma.nFTPurchaseEvent.findMany({
      where: {
        ...validMintNftPurchaseEvent,
        builderEvent: {
          week: {
            lte: week
          }
        },
        builderNft: {
          builderId,
          season
        }
      },
      select: {
        scoutWallet: {
          select: {
            scoutId: true
          }
        },
        tokensPurchased: true,
        builderNft: {
          select: {
            builderId: true,
            nftType: true
          }
        }
      }
    }),
    prisma.builderStrike.count({
      where: {
        builderId,
        deletedAt: null
      }
    })
  ]);
  const owners = await resolveTokenOwnershipForBuilder({
    builderId,
    week
  });

  const nftSupply = owners.byWallet.reduce((acc, owner) => acc + owner.totalNft, 0);
  const starterPackSupply = owners.byWallet.reduce((acc, owner) => acc + owner.totalStarter, 0);

  return {
    builderStrikes,
    nftSupply: { default: nftSupply, starterPack: starterPackSupply, total: nftSupply + starterPackSupply }
  };
}
