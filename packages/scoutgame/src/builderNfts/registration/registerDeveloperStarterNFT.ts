import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { Address } from 'viem';

import { getNFTReadonlyClient } from '../../protocol/clients/getNFTClient';
import { getStarterNFTReadonlyClient, getStarterNFTMinterClient } from '../../protocol/clients/getStarterNFTClient';
import { nftChain } from '../constants';

import { createBuilderNftStarterPack } from './createBuilderNftStarterPack';

export async function registerDeveloperStarterNFT({
  builderId,
  season,
  chainId = nftChain.id
}: {
  builderId: string;
  season: string;
  chainId?: number;
}) {
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

  if (!builder.githubUsers.length) {
    throw new InvalidInputError('Scout profile does not have a github user');
  }
  const primaryWallet = builder.wallets[0];

  if (!primaryWallet) {
    throw new InvalidInputError('Developer does not have a primary wallet');
  }

  const client = getNFTReadonlyClient(season);
  if (!client) {
    throw new Error(`Dev NFT contract client not found: ${season}`);
  }

  // Read the tokenId from the existing builder NFT Contract so that they match
  const tokenId = await client.getTokenIdForBuilder({
    args: { builderId }
  });

  if (!tokenId) {
    throw new InvalidInputError('Developer NFT not found');
  }

  const starterPackClient = getStarterNFTReadonlyClient(season);
  if (!starterPackClient) {
    throw new Error(`Dev NFT contract client not found: ${season}`);
  }

  const existingStarterPackTokenId = await starterPackClient
    .getTokenIdForBuilder({
      args: { builderId }
    })
    .catch(() => null);

  if (existingStarterPackTokenId && existingStarterPackTokenId !== tokenId) {
    throw new InvalidInputError('Developer NFT already registered on starter contract but with a different tokenId');
  } else if (!existingStarterPackTokenId) {
    // Register the builder token on the starter pack contract so that it can be minted
    await getStarterNFTMinterClient(season).registerBuilderToken({
      args: { builderId, builderTokenId: tokenId, builderWallet: primaryWallet.address }
    });
  }

  const builderNft = await createBuilderNftStarterPack({
    tokenId,
    builderId,
    avatar: builder.avatar ?? '',
    path: builder.path!,
    displayName: builder.displayName,
    season,
    contractAddress: starterPackClient.contractAddress,
    chainId
  });

  log.info(`Registered developer NFT starter pack for builder`, {
    userId: builderId,
    builderPath: builder.path,
    tokenId,
    season,
    nftType: 'starter_pack'
  });

  return builderNft;
}
