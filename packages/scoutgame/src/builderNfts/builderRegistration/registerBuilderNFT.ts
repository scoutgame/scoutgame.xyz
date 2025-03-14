import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { attestBuilderStatusEvent } from '@packages/scoutgameattestations/attestBuilderStatusEvent';
import type { Address, Chain } from 'viem';

import { getBuilderNftContractMinterClient } from '../clients/builderNftContractReadonlyClient';
import { builderNftChain, getBuilderNftContractAddress } from '../constants';
import { refreshBuilderNftPrice } from '../refreshBuilderNftPrice';

import { createBuilderNft } from './createBuilderNft';

export async function registerBuilderNFT({
  builderId,
  season,
  chain = builderNftChain,
  contractAddress
}: {
  builderId: string;
  season: string;
  chain?: Chain;
  contractAddress?: Address;
}) {
  if (!season) {
    throw new InvalidInputError('Season is required');
  }

  if (!contractAddress) {
    contractAddress = getBuilderNftContractAddress(season);
  }

  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError(`Invalid builderId. Must be a uuid: ${builderId}`);
  }

  const minterClient = getBuilderNftContractMinterClient();

  const existingBuilderNft = await prisma.builderNft.findFirst({
    where: {
      builderId,
      chainId: chain.id,
      season,
      nftType: BuilderNftType.default
    }
  });

  if (existingBuilderNft) {
    log.info(`Builder already existing with token id ${existingBuilderNft.tokenId}`);
    const updatedBuilderNft = await refreshBuilderNftPrice({ builderId, season });
    return updatedBuilderNft;
  }

  const builder = await prisma.scout.findFirstOrThrow({
    where: {
      id: builderId
    },
    select: {
      githubUsers: true,
      avatar: true,
      path: true,
      displayName: true,
      builderStatus: true,
      wallets: {
        where: {
          primary: true
        },
        select: {
          address: true
        }
      }
    }
  });

  if (!builder.githubUsers[0]) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }

  const primaryWallet = builder.wallets[0];

  if (!primaryWallet) {
    throw new InvalidInputError('Builder does not have a primary wallet');
  }

  let tokenId = await minterClient.getTokenIdForBuilder({ args: { builderId } }).catch((err) => null);

  if (!tokenId) {
    log.info(`Registering builder token for builder`, { userId: builderId });
    await minterClient.registerBuilderToken({ args: { builderId, account: primaryWallet.address } });

    tokenId = await minterClient.getTokenIdForBuilder({ args: { builderId } });

    await attestBuilderStatusEvent({
      builderId,
      event: {
        type: 'registered',
        description: `${builder.displayName} Builder NFT registered for season ${season} with token id ${tokenId}`,
        season
      }
    });
  }

  const builderNft = await createBuilderNft({
    season,
    tokenId,
    builderId,
    avatar: builder.avatar ?? '',
    path: builder.path!,
    displayName: builder.displayName,
    chainId: chain.id,
    contractAddress
  });

  log.info(`Registered builder NFT for builder`, {
    userId: builderId,
    builderPath: builder.path,
    tokenId,
    season,
    chainId: chain.id,
    contractAddress
  });

  return builderNft;
}
