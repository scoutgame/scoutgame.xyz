import { prisma } from '@charmverse/core/prisma-client';
import type { Address } from 'viem';

import { getCurrentSeasonStart } from '../../dates/utils';
import { uploadMetadata } from '../artwork/uploadMetadata';
import { builderContractStarterPackReadonlyApiClient } from '../clients/builderContractStarterPackReadClient';
import { builderNftChain, getBuilderStarterPackContractAddress } from '../constants';

import { uploadStarterPackArtwork, uploadStarterPackArtworkCongrats } from './starterPack/uploadStarterPackArtwork';

export async function createBuilderNftStarterPack({
  imageHostingBaseUrl,
  avatar,
  tokenId,
  builderId,
  displayName,
  path,
  season = getCurrentSeasonStart(),
  chainId = builderNftChain.id,
  contractAddress = getBuilderStarterPackContractAddress()
}: {
  imageHostingBaseUrl?: string;
  displayName: string;
  path: string;
  avatar: string | null;
  tokenId: bigint;
  builderId: string;
  starterNft?: boolean;
  season?: string;
  chainId?: number;
  contractAddress?: Address;
}) {
  const currentPrice = await builderContractStarterPackReadonlyApiClient.getTokenPurchasePrice({
    args: { amount: BigInt(1) }
  });

  const fileUrl = await uploadStarterPackArtwork({
    imageHostingBaseUrl,
    displayName,
    season,
    avatar,
    tokenId
  });

  const congratsImageUrl = await uploadStarterPackArtworkCongrats({
    imageHostingBaseUrl,
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

  const builderNft = await prisma.builderNft.create({
    data: {
      builderId,
      chainId,
      contractAddress,
      tokenId: Number(tokenId),
      season,
      currentPrice,
      imageUrl: fileUrl,
      congratsImageUrl,
      nftType: 'starter_pack'
    }
  });

  return builderNft;
}
