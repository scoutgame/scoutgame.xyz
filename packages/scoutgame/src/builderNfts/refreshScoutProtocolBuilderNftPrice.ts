import { InvalidInputError } from '@charmverse/core/errors';
import type { BuilderNft } from '@charmverse/core/prisma';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { prettyPrint } from '@packages/utils/strings';

import { currentSeason } from '../dates';
import { scoutgameMintsLogger } from '../loggers/mintsLogger';
import { getScoutProtocolBuilderNFTContract } from '../protocol/constants';

export async function refreshScoutProtocolBuilderNftPrice({
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

    const protocolBuilderNftContractClient = getScoutProtocolBuilderNFTContract();

    const tokenId = await protocolBuilderNftContractClient.getTokenIdForBuilder({ args: { builderId } });

    const currentPrice = await protocolBuilderNftContractClient.getTokenPurchasePrice({
      args: { tokenId, amount: BigInt(1) }
    });

    prettyPrint({ currentPrice });

    const existingNft = await prisma.builderNft.findFirstOrThrow({
      where: {
        builderId,
        season,
        nftType: BuilderNftType.default
      }
    });

    const decimals = BigInt(10) ** BigInt(18);

    const updatedNft = await prisma.builderNft.update({
      where: {
        id: existingNft.id
      },
      data: {
        currentPrice: currentPrice / decimals
      }
    });

    return updatedNft;
  } catch (error) {
    scoutgameMintsLogger.error('Error refreshing builder nft price', { builderId, season, error });
    throw error;
  }
}
