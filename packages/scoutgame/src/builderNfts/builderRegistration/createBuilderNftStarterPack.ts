import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentSeasonStart } from '@packages/dates/utils';
import { isOnchainPlatform } from '@packages/utils/platform';
import type { Address } from 'viem';

import { uploadMetadata } from '../artwork/uploadMetadata';
import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from '../artwork/uploadStarterPackArtwork';
import { getBuilderNftStarterPackReadonlyClient } from '../clients/starterPack/getBuilderContractStarterPackReadonlyClient';
import { nftChain, getBuilderNftStarterPackContractAddress } from '../constants';

export async function createBuilderNftStarterPack({
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season = getCurrentSeasonStart(),
  chainId = nftChain.id,
  contractAddress
}: {
  displayName: string;
  path: string;
  avatar: string;
  tokenId: bigint;
  builderId: string;
  starterNft?: boolean;
  season?: string;
  chainId?: number;
  contractAddress?: Address;
}) {
  contractAddress = contractAddress ?? getBuilderNftStarterPackContractAddress(season);
  const client = getBuilderNftStarterPackReadonlyClient(season);
  if (!client || !contractAddress) {
    throw new Error(`Dev NFT contract client not found: ${season}, contractAddress: ${contractAddress}`);
  }

  const currentPrice = await client.getTokenPurchasePrice({
    args: { amount: BigInt(1) }
  });

  const fileUrl = await uploadStarterPackArtwork({
    displayName,
    season,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadStarterPackArtworkCongrats({
    season,
    tokenId,
    userImage: fileUrl,
    builderId
  });

  await uploadMetadata({
    season,
    tokenId,
    path,
    starterPack: true
  });

  const isOnchain = isOnchainPlatform();

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId,
      contractAddress,
      tokenId: Number(tokenId),
      season,
      currentPrice: isOnchain ? undefined : currentPrice,
      currentPriceDevToken: isOnchain ? currentPrice.toString() : undefined,
      imageUrl: fileUrl,
      congratsImageUrl,
      nftType: 'starter_pack'
    }
  });

  return builderNft;
}
