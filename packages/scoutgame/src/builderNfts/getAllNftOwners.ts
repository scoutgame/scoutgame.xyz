import type { BuilderNftType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { uniqueValues } from '@packages/utils/array';

import { validMintNftPurchaseEvent } from './constants';

export async function getAllNftOwners({
  builderId,
  season,
  nftType
}: {
  builderId: string;
  season: string;
  nftType: BuilderNftType;
}): Promise<string[]> {
  const builderNft = await prisma.builderNft.findUnique({
    where: {
      builderId_season_nftType: {
        season,
        builderId,
        nftType
      }
    },
    select: {
      nftSoldEvents: {
        where: validMintNftPurchaseEvent,
        select: {
          scoutWallet: {
            select: {
              scoutId: true
            }
          }
        }
      }
    }
  });

  return uniqueValues(builderNft?.nftSoldEvents.map((ev) => ev.scoutWallet!.scoutId) || []);
}
