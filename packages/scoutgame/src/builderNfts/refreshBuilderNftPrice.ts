import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderNft } from '@charmverse/core/prisma';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { format } from 'sharp';
import { formatUnits } from 'viem';

import { scoutgameMintsLogger } from '../loggers/mintsLogger';
import { getNFTReadonlyClient } from '../protocol/clients/getNFTClient';
import { devTokenDecimals } from '../protocol/constants';

export async function refreshBuilderNftPrice({
  builderId,
  season
}: {
  builderId: string;
  season: string;
}): Promise<BuilderNft> {
  try {
    if (!stringUtils.isUUID(builderId)) {
      throw new InvalidInputError(`Invalid builderId. Must be a uuid: ${builderId}`);
    }

    const contractClient = getNFTReadonlyClient();
    if (!contractClient) {
      throw new Error('Cannot refresh builder nft price. Missing contract client');
    }

    const tokenId = await contractClient.getTokenIdForBuilder({ args: { builderId } });

    const currentPrice = await contractClient.getTokenPurchasePrice({
      args: { tokenId, amount: BigInt(1) }
    });

    const existingNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        builderId,
        season,
        nftType: BuilderNftType.default
      }
    });

    const updatedNft = await prisma.builderNft.update({
      where: {
        id: existingNft.id
      },
      data: {
        currentPrice: BigInt(parseInt(formatUnits(currentPrice, devTokenDecimals))),
        currentPriceDevToken: currentPrice.toString()
      }
    });

    return updatedNft;
  } catch (error) {
    scoutgameMintsLogger.error('Error refreshing builder nft price', { builderId, season, error });
    throw error;
  }
}
