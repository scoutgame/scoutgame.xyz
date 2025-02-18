import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { Address } from 'viem';

import { getPreSeasonTwoBuilderNftContractReadonlyClient } from '../clients/preseason02/getPreSeasonTwoBuilderNftContractReadonlyClient';
import { getBuilderNftContractStarterPackMinterClient } from '../clients/starterPack/getBuilderContractStarterPackMinterWriteClient';
import { getBuilderNftStarterPackReadonlyClient } from '../clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { builderNftChain, getBuilderNftStarterPackContractAddress } from '../constants';

import { createBuilderNftStarterPack } from './createBuilderNftStarterPack';

export async function registerBuilderStarterPackNFT({
  builderId,
  season,
  chainId = builderNftChain.id,
  contractAddress
}: {
  builderId: string;
  season: string;
  chainId?: number;
  contractAddress?: Address;
}) {
  if (!season) {
    throw new InvalidInputError('Season is required');
  }

  if (!contractAddress) {
    contractAddress = getBuilderNftStarterPackContractAddress(season);
  }

  if (!stringUtils.isUUID(builderId)) {
    throw new InvalidInputError(`Invalid builderId. Must be a uuid: ${builderId}`);
  }

  const existingBuilderNft = await prisma.builderNft.findFirst({
    where: {
      builderId,
      chainId,
      season,
      nftType: 'starter_pack'
    }
  });

  if (existingBuilderNft) {
    log.info(`Builder starter pack NFT already exists with token id ${existingBuilderNft.tokenId}`);
    return existingBuilderNft;
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
      builderStatus: true
    }
  });

  if (!builder.githubUsers.length) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }

  // Read the tokenId from the existing builder NFT Contract so that they match
  const tokenId = await getPreSeasonTwoBuilderNftContractReadonlyClient().getTokenIdForBuilder({
    args: { builderId }
  });

  if (!tokenId) {
    throw new InvalidInputError('Builder NFT not found');
  }

  const existingStarterPackTokenId = await getBuilderNftStarterPackReadonlyClient()
    .getTokenIdForBuilder({
      args: { builderId }
    })
    .catch(() => null);

  if (existingStarterPackTokenId && existingStarterPackTokenId !== tokenId) {
    throw new InvalidInputError('Builder NFT already registered on starter pack contract but with a different tokenId');
  } else if (!existingStarterPackTokenId) {
    // Register the builder token on the starter pack contract so that it can be minted
    await getBuilderNftContractStarterPackMinterClient().registerBuilderToken({
      args: { builderId, builderTokenId: tokenId }
    });
  }

  const builderNft = await createBuilderNftStarterPack({
    tokenId,
    builderId,
    avatar: builder.avatar ?? '',
    path: builder.path!,
    displayName: builder.displayName,
    season,
    contractAddress,
    chainId
  });

  log.info(`Registered builder NFT starter pack for builder`, {
    userId: builderId,
    builderPath: builder.path,
    tokenId,
    season,
    nftType: 'starter_pack'
  });

  return builderNft;
}
