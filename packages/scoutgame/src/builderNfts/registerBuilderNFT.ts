import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { currentSeason } from '@packages/scoutgame/utils';
import { getWalletClient } from '@root/lib/blockchain/walletClient';

import { builderContractAddress, builderNftChain, builderSmartContractOwnerKey } from './constants';
import { ContractApiClient } from './nftContractApiClient';
import { refreshBuilderNftPrice } from './refreshBuilderNftPrice';

const builderNftWriteApiClient = new ContractApiClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  walletClient: getWalletClient({ chainId: builderNftChain.id, privateKey: builderSmartContractOwnerKey })
});

export async function registerBuilderNFT({ builderId }: { builderId: string }) {
  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError('Invalid builderId. Must be a uuid');
  }

  const existingBuilderNft = await prisma.builderNft.findFirst({
    where: {
      builderId,
      chainId: builderNftChain.id,
      contractAddress: builderContractAddress,
      season: currentSeason
    }
  });

  if (existingBuilderNft) {
    const updatedBuilderNft = await refreshBuilderNftPrice({ builderId });
    return updatedBuilderNft;
  }

  const builder = await prisma.scout.findFirstOrThrow({
    where: {
      id: builderId
    },
    select: {
      githubUser: true,
      builder: true
    }
  });

  if (!builder.githubUser) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }

  if (!builder.builder) {
    throw new InvalidInputError('Scout profile not marked as a builder');
  }

  let existingTokenId = await builderNftWriteApiClient.getTokenIdForBuilder({ args: { builderId } }).catch(() => null);

  if (!existingTokenId) {
    log.info(`Registering builder token for builderId: ${builderId}`);
    await builderNftWriteApiClient.registerBuilderToken({ args: { builderId } });
    existingTokenId = await builderNftWriteApiClient.getTokenIdForBuilder({ args: { builderId } });
  }

  const nftWithRefreshedPrice = await refreshBuilderNftPrice({ builderId });

  log.info(`Last price: ${nftWithRefreshedPrice.currentPrice}`);

  return nftWithRefreshedPrice;
}